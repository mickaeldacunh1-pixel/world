#!/usr/bin/env python3
"""
🤖 CODE AGENT - Ton assistant de développement personnel
Un vrai agent de code qui fait ce que tu lui demandes.
"""

import os
import sys
import json
import subprocess
import webbrowser
import threading
import time
import re
import glob
import shutil
import zipfile
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List, Any

import httpx
from flask import Flask, render_template_string, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv
from rich.console import Console

# Load environment variables
load_dotenv()

console = Console()
app = Flask(__name__)
CORS(app)

# Version actuelle - lue depuis version.txt
def get_version():
    try:
        version_file = Path(__file__).parent / "version.txt"
        if version_file.exists():
            return version_file.read_text().strip()
    except:
        pass
    return "1.0.0"

VERSION = get_version()
UPDATE_URL = "https://tobi-dev-agent.preview.emergentagent.com/downloads/code-agent"
VERSION_URL = f"{UPDATE_URL}/version.txt"
ZIP_URL = f"{UPDATE_URL}.zip"

# ============== AUTO-UPDATE ==============

def check_for_updates():
    """Vérifie si une mise à jour est disponible"""
    try:
        console.print("[dim]🔄 Vérification des mises à jour...[/dim]")
        response = httpx.get(VERSION_URL, timeout=5)
        if response.status_code == 200:
            latest_version = response.text.strip()
            if latest_version > VERSION:
                return latest_version
    except Exception:
        pass
    return None

def auto_update(new_version):
    """Télécharge et installe la mise à jour"""
    try:
        console.print(f"[yellow]⬆️  Nouvelle version disponible: {new_version}[/yellow]")
        console.print("[dim]Téléchargement en cours...[/dim]")
        
        # Télécharger le zip
        response = httpx.get(ZIP_URL, timeout=30)
        if response.status_code != 200:
            console.print("[red]❌ Échec du téléchargement[/red]")
            return False
        
        # Sauvegarder le zip
        zip_path = Path(__file__).parent / "update.zip"
        with open(zip_path, 'wb') as f:
            f.write(response.content)
        
        # Extraire
        extract_dir = Path(__file__).parent / "update_temp"
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        # Copier les nouveaux fichiers (sauf .env)
        source_dir = extract_dir / "code-agent"
        for item in source_dir.iterdir():
            if item.name == '.env':
                continue  # Ne pas écraser la config
            dest = Path(__file__).parent / item.name
            if item.is_file():
                shutil.copy2(item, dest)
            else:
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.copytree(item, dest)
        
        # Nettoyage
        zip_path.unlink()
        shutil.rmtree(extract_dir)
        
        console.print(f"[green]✅ Mis à jour vers la version {new_version}![/green]")
        console.print("[yellow]🔄 Redémarrage nécessaire. Relance l'agent.[/yellow]")
        return True
        
    except Exception as e:
        console.print(f"[red]❌ Erreur de mise à jour: {e}[/red]")
        return False

# ============== CONFIGURATION ==============

class Config:
    EMERGENT_API_KEY = os.getenv('EMERGENT_API_KEY', '')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
    DEFAULT_MODEL = os.getenv('DEFAULT_MODEL', 'gpt-4o')
    PORT = int(os.getenv('PORT', 8888))
    PROJECT_PATH = os.getenv('PROJECT_PATH', os.getcwd())

config = Config()

# ============== TOOLS (Ce que l'agent peut faire) ==============

class AgentTools:
    """Outils que l'agent peut utiliser"""
    
    @staticmethod
    def read_file(path: str) -> Dict:
        """Lire le contenu d'un fichier"""
        try:
            full_path = os.path.join(config.PROJECT_PATH, path) if not os.path.isabs(path) else path
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            return {"success": True, "content": content, "path": full_path}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def write_file(path: str, content: str) -> Dict:
        """Écrire dans un fichier"""
        try:
            full_path = os.path.join(config.PROJECT_PATH, path) if not os.path.isabs(path) else path
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return {"success": True, "message": f"Fichier créé/modifié: {full_path}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def execute_command(command: str, timeout: int = 60) -> Dict:
        """Exécuter une commande shell"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=config.PROJECT_PATH
            )
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": f"Timeout après {timeout}s"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def list_files(pattern: str = "**/*", max_depth: int = 3) -> Dict:
        """Lister les fichiers du projet"""
        try:
            base = Path(config.PROJECT_PATH)
            files = []
            for p in base.glob(pattern):
                if p.is_file():
                    rel = p.relative_to(base)
                    if len(rel.parts) <= max_depth:
                        files.append(str(rel))
            return {"success": True, "files": files[:200]}  # Limite à 200
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def search_in_files(query: str, file_pattern: str = "**/*") -> Dict:
        """Rechercher du texte dans les fichiers"""
        try:
            base = Path(config.PROJECT_PATH)
            results = []
            for p in base.glob(file_pattern):
                if p.is_file() and p.suffix in ['.py', '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.md', '.txt', '.env']:
                    try:
                        content = p.read_text(encoding='utf-8', errors='ignore')
                        for i, line in enumerate(content.split('\n'), 1):
                            if query.lower() in line.lower():
                                results.append({
                                    "file": str(p.relative_to(base)),
                                    "line": i,
                                    "content": line.strip()[:200]
                                })
                    except:
                        pass
            return {"success": True, "results": results[:50]}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def get_project_structure() -> Dict:
        """Obtenir la structure du projet"""
        try:
            structure = []
            base = Path(config.PROJECT_PATH)
            for p in sorted(base.rglob('*')):
                if any(x in str(p) for x in ['node_modules', '.git', '__pycache__', 'venv', '.venv']):
                    continue
                rel = p.relative_to(base)
                if len(rel.parts) <= 4:
                    prefix = "📁 " if p.is_dir() else "📄 "
                    indent = "  " * (len(rel.parts) - 1)
                    structure.append(f"{indent}{prefix}{rel.name}")
            return {"success": True, "structure": "\n".join(structure[:100])}
        except Exception as e:
            return {"success": False, "error": str(e)}

tools = AgentTools()

# ============== SESSION MANAGER ==============

import json
import os

class SessionManager:
    """Gestionnaire de sessions avec persistance fichier"""
    
    def __init__(self, storage_file: str = None):
        self._storage_file = storage_file or os.path.join(os.path.dirname(__file__), '.cody_memory.json')
        self._sessions = {}
        self._default_session = "default"
        self._load_from_file()
    
    def _load_from_file(self):
        """Charger l'historique depuis le fichier"""
        try:
            if os.path.exists(self._storage_file):
                with open(self._storage_file, 'r', encoding='utf-8') as f:
                    self._sessions = json.load(f)
                console.print(f"[green]✅ Mémoire chargée ({sum(len(v) for v in self._sessions.values())} messages)[/green]")
        except Exception as e:
            console.print(f"[yellow]⚠️ Impossible de charger la mémoire: {e}[/yellow]")
            self._sessions = {}
    
    def _save_to_file(self):
        """Sauvegarder l'historique dans le fichier"""
        try:
            with open(self._storage_file, 'w', encoding='utf-8') as f:
                json.dump(self._sessions, f, ensure_ascii=False, indent=2)
        except Exception as e:
            console.print(f"[red]❌ Erreur sauvegarde mémoire: {e}[/red]")
    
    def get_history(self, session_id: str = None) -> list:
        """Obtenir l'historique d'une session"""
        sid = session_id or self._default_session
        if sid not in self._sessions:
            self._sessions[sid] = []
        return self._sessions[sid]
    
    def add_message(self, role: str, content: str, session_id: str = None):
        """Ajouter un message à l'historique"""
        sid = session_id or self._default_session
        if sid not in self._sessions:
            self._sessions[sid] = []
        self._sessions[sid].append({"role": role, "content": content})
        # Limiter l'historique à 50 messages pour éviter les tokens trop longs
        if len(self._sessions[sid]) > 50:
            self._sessions[sid] = self._sessions[sid][-50:]
        # Sauvegarder après chaque message
        self._save_to_file()
    
    def clear_history(self, session_id: str = None):
        """Effacer l'historique d'une session"""
        sid = session_id or self._default_session
        self._sessions[sid] = []
        self._save_to_file()
    
    def get_all_sessions(self) -> list:
        """Liste toutes les sessions actives"""
        return list(self._sessions.keys())
    
    def get_message_count(self) -> int:
        """Nombre total de messages"""
        return sum(len(v) for v in self._sessions.values())

# Instance globale du gestionnaire de sessions
session_manager = SessionManager()

# ============== LLM CLIENT ==============

class LLMClient:
    """Client pour communiquer avec les LLMs"""
    
    SYSTEM_PROMPT = """Tu es Cody, un assistant de développement expert et bienveillant.

PERSONNALITÉ:
- Tu es amical, patient et enthousiaste
- Tu expliques clairement sans être condescendant
- Tu célèbres les succès de l'utilisateur
- Tu restes positif face aux erreurs ("pas de souci, on va corriger ça")

CAPACITÉS:
- Lire et écrire des fichiers de code
- Exécuter des commandes shell (git, npm, pip, etc.)
- Analyser, débugger et corriger du code
- Expliquer des concepts techniques
- Aider au déploiement d'applications

CONTEXTE CONVERSATIONNEL:
- Tu as accès à l'historique complet de notre conversation
- Référence les messages précédents naturellement ("comme on a vu tout à l'heure...")
- Si l'utilisateur dit "continue" ou "fais-le", rappelle-toi ce qu'il voulait
- Demande des clarifications si quelque chose n'est pas clair

FORMAT DE RÉPONSE POUR LES ACTIONS:
Quand tu dois effectuer une action, utilise ce format JSON:
```action
{"tool": "nom_outil", "params": {"param1": "valeur1"}}
```

OUTILS DISPONIBLES:
- read_file: {"path": "chemin/fichier"} - Lire un fichier
- write_file: {"path": "chemin", "content": "contenu"} - Écrire/créer un fichier
- execute_command: {"command": "commande"} - Exécuter une commande shell
- list_files: {"pattern": "**/*.py"} - Lister des fichiers
- search_in_files: {"query": "texte", "file_pattern": "**/*"} - Rechercher dans le code
- get_project_structure: {} - Voir l'arborescence du projet

STYLE DE RÉPONSE:
- Sois concis mais complet
- Utilise le formatage Markdown (gras, listes, code)
- Structure tes réponses avec des titres si nécessaire
- Après une action, explique ce que tu as fait et le résultat

Réponds toujours en français."""

    def __init__(self, session_id: str = None):
        self.session_id = session_id or "default"
    
    @property
    def conversation_history(self) -> list:
        """Obtenir l'historique depuis le gestionnaire de sessions"""
        return session_manager.get_history(self.session_id)
    
    async def chat(self, message: str, model: str = None) -> str:
        """Envoyer un message et obtenir une réponse"""
        model = model or config.DEFAULT_MODEL
        
        # Ajouter le message utilisateur à l'historique persistant
        session_manager.add_message("user", message, self.session_id)
        
        # Determine which API to use
        if config.EMERGENT_API_KEY:
            response = await self._call_emergent(model)
        elif 'claude' in model.lower() and config.ANTHROPIC_API_KEY:
            response = await self._call_anthropic(model)
        elif config.OPENAI_API_KEY:
            response = await self._call_openai(model)
        else:
            response = "❌ Aucune clé API configurée. Configure EMERGENT_API_KEY, OPENAI_API_KEY ou ANTHROPIC_API_KEY dans le fichier .env"
        
        # Ajouter la réponse à l'historique persistant
        session_manager.add_message("assistant", response, self.session_id)
        
        # Process any actions in the response
        response = await self._process_actions(response)
        
        return response
    
    async def _call_emergent(self, model: str) -> str:
        """Appeler l'API Emergent via emergentintegrations"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            # Map model names
            if 'gpt-5' in model.lower() or 'gpt-4o' in model.lower():
                provider, model_name = "openai", "gpt-4o"
            elif 'gpt-4o-mini' in model.lower():
                provider, model_name = "openai", "gpt-4o-mini"
            elif 'claude' in model.lower():
                provider, model_name = "anthropic", "claude-sonnet-4-20250514"
            else:
                provider, model_name = "openai", "gpt-4o"
            
            # Construire le contexte avec tout l'historique
            history_context = ""
            if len(self.conversation_history) > 1:
                history_context = "HISTORIQUE DE LA CONVERSATION:\n"
                for msg in self.conversation_history[:-1]:
                    role = "Utilisateur" if msg["role"] == "user" else "Assistant"
                    history_context += f"{role}: {msg['content'][:500]}...\n" if len(msg['content']) > 500 else f"{role}: {msg['content']}\n"
                history_context += "\nMESSAGE ACTUEL:\n"
            
            # Create chat instance
            chat = LlmChat(
                api_key=config.EMERGENT_API_KEY,
                session_id=self.session_id,
                system_message=self.SYSTEM_PROMPT + "\n\n" + history_context
            ).with_model(provider, model_name)
            
            # Send current message (le dernier dans l'historique)
            last_msg = self.conversation_history[-1]["content"] if self.conversation_history else ""
            response = await chat.send_message(UserMessage(text=last_msg))
            
            return response
            
        except ImportError:
            return "❌ Module emergentintegrations non installe. Lance: pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/"
        except Exception as e:
            return f"❌ Erreur: {str(e)}"
    
    async def _call_openai(self, model: str) -> str:
        """Appeler l'API OpenAI directement"""
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {config.OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model if model in ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] else 'gpt-4o',
                        "messages": [
                            {"role": "system", "content": self.SYSTEM_PROMPT},
                            *self.conversation_history
                        ],
                        "max_tokens": 4096
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    return f"❌ Erreur OpenAI: {response.status_code}"
        except Exception as e:
            return f"❌ Erreur: {str(e)}"
    
    async def _call_anthropic(self, model: str) -> str:
        """Appeler l'API Anthropic directement"""
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": config.ANTHROPIC_API_KEY,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 4096,
                        "system": self.SYSTEM_PROMPT,
                        "messages": self.conversation_history
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["content"][0]["text"]
                else:
                    return f"❌ Erreur Anthropic: {response.status_code}"
        except Exception as e:
            return f"❌ Erreur: {str(e)}"
    
    async def _process_actions(self, response: str) -> str:
        """Traiter les actions dans la réponse"""
        action_pattern = r'```action\s*\n?({.*?})\s*\n?```'
        matches = re.findall(action_pattern, response, re.DOTALL)
        
        for match in matches:
            try:
                action = json.loads(match)
                tool_name = action.get('tool')
                params = action.get('params', {})
                
                result = None
                if tool_name == 'read_file':
                    result = tools.read_file(params.get('path', ''))
                elif tool_name == 'write_file':
                    result = tools.write_file(params.get('path', ''), params.get('content', ''))
                elif tool_name == 'execute_command':
                    result = tools.execute_command(params.get('command', ''))
                elif tool_name == 'list_files':
                    result = tools.list_files(params.get('pattern', '**/*'))
                elif tool_name == 'search_in_files':
                    result = tools.search_in_files(params.get('query', ''), params.get('file_pattern', '**/*'))
                elif tool_name == 'get_project_structure':
                    result = tools.get_project_structure()
                
                if result:
                    result_str = f"\n\n📋 **Résultat de {tool_name}:**\n```json\n{json.dumps(result, indent=2, ensure_ascii=False)[:2000]}\n```"
                    response = response.replace(f'```action\n{match}\n```', result_str)
                    response = response.replace(f'```action{match}```', result_str)
            except json.JSONDecodeError:
                pass
        
        return response
    
    def clear_history(self):
        """Effacer l'historique de conversation"""
        session_manager.clear_history(self.session_id)
    
    def get_history_length(self) -> int:
        """Retourne le nombre de messages dans l'historique"""
        return len(self.conversation_history)

# Instance globale du client LLM
llm = LLMClient(session_id="default")

# ============== WEB INTERFACE ==============

HTML_TEMPLATE = r'''
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤖 Cody</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            --bg-main: #ffffff;
            --bg-sidebar: #f9fafb;
            --bg-user-msg: #f3f4f6;
            --bg-input: #ffffff;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --text-muted: #9ca3af;
            --accent: #f97316;
            --accent-hover: #ea580c;
            --border: #e5e7eb;
            --border-light: #f3f4f6;
            --success: #22c55e;
            --code-bg: #1e1e1e;
            --code-text: #d4d4d4;
            --shadow: 0 1px 3px rgba(0,0,0,0.1);
            --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-main);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        /* ========== HEADER ========== */
        header {
            background: var(--bg-main);
            border-bottom: 1px solid var(--border);
            padding: 0.75rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .logo-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, var(--accent), #fb923c);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            box-shadow: var(--shadow);
        }
        
        .logo-text { 
            font-weight: 700; 
            font-size: 1.125rem;
            color: var(--text-primary);
        }
        
        .header-actions {
            display: flex;
            gap: 0.75rem;
            align-items: center;
        }
        
        .header-btn {
            background: var(--bg-sidebar);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            padding: 0.5rem 0.875rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.8125rem;
            font-weight: 500;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            gap: 0.375rem;
        }
        
        .header-btn:hover { 
            background: var(--bg-main);
            border-color: var(--text-muted);
            color: var(--text-primary);
        }
        
        select.model-select {
            background: var(--bg-sidebar);
            border: 1px solid var(--border);
            color: var(--text-primary);
            padding: 0.5rem 0.875rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.8125rem;
            font-weight: 500;
            font-family: inherit;
        }
        
        .memory-badge {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--accent);
            background: rgba(249, 115, 22, 0.1);
            padding: 0.375rem 0.625rem;
            border-radius: 9999px;
            border: 1px solid rgba(249, 115, 22, 0.2);
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.75rem;
            color: var(--success);
        }
        
        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--success);
            animation: pulse-dot 2s infinite;
        }
        
        @keyframes pulse-dot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        /* ========== MAIN CONTENT ========== */
        main {
            flex: 1;
            display: flex;
            flex-direction: column;
            max-width: 900px;
            margin: 0 auto;
            width: 100%;
            padding: 0;
            height: calc(100vh - 60px);
            overflow: hidden;
        }
        
        /* ========== MESSAGES ========== */
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem 1.5rem 2rem;
            display: flex;
            flex-direction: column;
            gap: 0;
            scroll-behavior: smooth;
            padding-bottom: 200px;
        }
        
        .message {
            animation: fadeIn 0.3s ease;
            padding: 1.5rem 0;
        }
        
        .message + .message {
            border-top: 1px solid var(--border-light);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Message Assistant - Style Emergent */
        .message.assistant .message-wrapper {
            display: flex;
            gap: 1.25rem;
            align-items: flex-start;
            max-width: 800px;
        }
        
        .message.assistant .avatar {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: linear-gradient(135deg, var(--accent), #fb923c);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 1rem;
            box-shadow: var(--shadow);
        }
        
        .message.assistant .content {
            flex: 1;
            line-height: 1.8;
            color: var(--text-primary);
            font-size: 1rem;
            letter-spacing: -0.01em;
        }
        
        /* Message User - Style identique à l'assistant (pas de bulle) */
        .message.user {
            padding: 1.5rem 0;
            background: var(--bg-sidebar);
        }
        
        .message.user .message-wrapper {
            display: flex;
            gap: 1.25rem;
            align-items: flex-start;
            max-width: 800px;
        }
        
        .message.user .avatar {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 1rem;
            color: white;
            box-shadow: var(--shadow);
        }
        
        .message.user .content {
            flex: 1;
            line-height: 1.8;
            color: var(--text-primary);
            font-size: 0.9375rem;
        }
        
        /* Code blocks */
        .content pre {
            background: var(--code-bg);
            color: var(--code-text);
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1rem 0;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 0.8125rem;
            line-height: 1.5;
            box-shadow: var(--shadow);
        }
        
        .content code {
            background: rgba(0,0,0,0.06);
            padding: 0.125rem 0.375rem;
            border-radius: 4px;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 0.875em;
            color: #c7254e;
        }
        
        .content pre code { 
            background: none; 
            padding: 0; 
            color: inherit;
        }
        
        /* Markdown elements */
        .content h1 { font-size: 1.625rem; font-weight: 700; margin: 1.5rem 0 0.75rem; color: var(--text-primary); }
        .content h2 { font-size: 1.375rem; font-weight: 600; margin: 1.25rem 0 0.625rem; color: var(--text-primary); }
        .content h3 { font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem; color: var(--text-primary); }
        .content ul, .content ol { margin: 0.875rem 0 0.875rem 1.25rem; }
        .content li { margin: 0.5rem 0; line-height: 1.7; }
        .content p { margin: 0.75rem 0; }
        .content strong { font-weight: 600; color: var(--text-primary); }
        .content em { font-style: italic; color: var(--text-secondary); }
        .content a { color: var(--accent); text-decoration: none; font-weight: 500; }
        .content a:hover { text-decoration: underline; }
        
        /* Typing indicator - Style Emergent */
        .typing-container {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem 0;
        }
        
        .typing-dots {
            display: flex;
            gap: 4px;
        }
        
        .typing-dots span {
            width: 8px;
            height: 8px;
            background: var(--accent);
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }
        
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        
        .typing-text {
            font-size: 0.875rem;
            color: var(--text-secondary);
            font-style: italic;
        }
        
        @keyframes typing {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1); }
        }
        
        /* Status bar */
        .status-bar {
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--text-primary);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-size: 0.8125rem;
            font-weight: 500;
            display: none;
            align-items: center;
            gap: 0.5rem;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
        }
        
        .status-bar.visible {
            display: flex;
            animation: slideUp 0.3s ease;
        }
        
        .status-bar .spinner {
            width: 14px;
            height: 14px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(10px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* ========== INPUT AREA ========== */
        .input-area {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            max-width: 900px;
            margin: 0 auto;
            background: var(--bg-main);
            padding: 1rem 1.5rem 1.5rem;
            border-top: 1px solid var(--border-light);
            z-index: 100;
        }
        
        .input-container {
            background: var(--bg-main);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 0.75rem;
            box-shadow: var(--shadow-lg);
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        
        .input-container:focus-within {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1), var(--shadow-lg);
        }
        
        .emoji-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
            padding: 0.5rem 0.25rem;
            border-bottom: 1px solid var(--border-light);
            margin-bottom: 0.5rem;
        }
        
        .emoji-btn {
            font-size: 1.25rem;
            padding: 0.25rem 0.375rem;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.15s ease;
            user-select: none;
        }
        
        .emoji-btn:hover {
            background: var(--bg-sidebar);
            transform: scale(1.2);
        }
        
        .emoji-btn:active {
            transform: scale(0.95);
        }
        
        .input-wrapper {
            display: flex;
            gap: 0.5rem;
            align-items: flex-end;
        }
        
        textarea {
            flex: 1;
            background: transparent;
            border: none;
            padding: 0.5rem 0.75rem;
            color: var(--text-primary);
            font-size: 0.9375rem;
            resize: none;
            min-height: 24px;
            max-height: 200px;
            font-family: inherit;
            line-height: 1.5;
        }
        
        textarea:focus { outline: none; }
        textarea::placeholder { color: var(--text-muted); }
        
        .input-actions {
            display: flex;
            gap: 0.375rem;
        }
        
        .action-btn {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
            font-size: 1rem;
        }
        
        .action-btn.secondary {
            background: var(--bg-sidebar);
            color: var(--text-secondary);
        }
        
        .action-btn.secondary:hover {
            background: var(--border);
            color: var(--text-primary);
        }
        
        .action-btn.primary {
            background: var(--accent);
            color: white;
        }
        
        .action-btn.primary:hover {
            background: var(--accent-hover);
            transform: scale(1.05);
        }
        
        .action-btn.primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .action-btn.recording {
            background: #ef4444 !important;
            animation: pulse-record 1s infinite;
        }
        
        @keyframes pulse-record {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .input-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 0.625rem;
            padding: 0 0.25rem;
            font-size: 0.75rem;
            color: var(--text-muted);
        }
        
        .project-path {
            display: flex;
            align-items: center;
            gap: 0.375rem;
        }
        
        .project-path input {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.75rem;
            width: 300px;
        }
        
        .project-path input:focus { outline: none; color: var(--text-primary); }
        
        .voice-status {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }
        
        /* ========== SCROLLBAR ========== */
        .messages::-webkit-scrollbar { width: 6px; }
        .messages::-webkit-scrollbar-track { background: transparent; }
        .messages::-webkit-scrollbar-thumb { 
            background: var(--border); 
            border-radius: 3px;
        }
        .messages::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
        
        /* ========== RESPONSIVE ========== */
        @media (max-width: 768px) {
            header { padding: 0.625rem 1rem; }
            .logo-text { font-size: 1rem; }
            .messages { padding: 1rem; }
            .input-area { padding: 0.75rem 1rem 1rem; }
            .message.user .message-wrapper { max-width: 95%; }
            .project-path input { width: 150px; }
        }
    </style>
</head>
<body>
    <header>
        <div class="logo">
            <div class="logo-icon">🤖</div>
            <div class="logo-text">Cody</div>
        </div>
        <div class="header-actions">
            <div class="status-indicator">
                <div class="status-dot"></div>
                <span>En ligne</span>
            </div>
            <div class="memory-badge" id="memoryIndicator" title="Messages en memoire">
                🧠 <span id="memoryCount">0</span>
            </div>
            <select class="model-select" id="modelSelect">
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-sonnet">Claude Sonnet</option>
            </select>
            <button class="header-btn" onclick="toggleNotif()" id="notifBtn" title="Activer/Desactiver les notifications">
                <span>🔔</span>
            </button>
            <button class="header-btn" onclick="clearChat()">
                <span>🗑️</span> Effacer
            </button>
            <button class="header-btn" onclick="showSettings()">⚙️</button>
        </div>
    </header>
    
    <main>
        <div class="messages" id="messages">
            <div class="message assistant">
                <div class="message-wrapper">
                    <div class="avatar">🤖</div>
                    <div class="content">
                        <strong>Bonjour ! Je suis Cody.</strong><br><br>
                        Je suis ton assistant de développement personnel. Je peux :<br><br>
                        • <strong>📁 Lire et écrire</strong> des fichiers de ton projet<br>
                        • <strong>🖥️ Exécuter</strong> des commandes shell<br>
                        • <strong>🔍 Rechercher</strong> dans ton code<br>
                        • <strong>🐛 Débugger</strong> et corriger des bugs<br><br>
                        <em>Je garde le contexte de notre conversation. Dis-moi ce dont tu as besoin !</em>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="input-area">
            <div class="input-container">
                <div class="input-wrapper">
                    <textarea id="input" placeholder="Message Cody..." rows="1"></textarea>
                    <div class="input-actions">
                        <button class="action-btn secondary" onclick="toggleRecording()" id="micBtn" title="Enregistrer un message vocal">🎤</button>
                        <button class="action-btn secondary" onclick="toggleVoice()" id="voiceBtn" title="Activer/Désactiver la synthèse vocale">🔊</button>
                        <button class="action-btn primary" onclick="sendMessage()" id="sendBtn" title="Envoyer">➤</button>
                    </div>
                </div>
                <div class="emoji-bar">
                    <span class="emoji-btn" onclick="addEmoji('😊')" title="Content">😊</span>
                    <span class="emoji-btn" onclick="addEmoji('👍')" title="Super">👍</span>
                    <span class="emoji-btn" onclick="addEmoji('🎉')" title="Celebration">🎉</span>
                    <span class="emoji-btn" onclick="addEmoji('🚀')" title="Fusee">🚀</span>
                    <span class="emoji-btn" onclick="addEmoji('💡')" title="Idee">💡</span>
                    <span class="emoji-btn" onclick="addEmoji('🔥')" title="Feu">🔥</span>
                    <span class="emoji-btn" onclick="addEmoji('✅')" title="OK">✅</span>
                    <span class="emoji-btn" onclick="addEmoji('❌')" title="Non">❌</span>
                    <span class="emoji-btn" onclick="addEmoji('⚠️')" title="Attention">⚠️</span>
                    <span class="emoji-btn" onclick="addEmoji('❓')" title="Question">❓</span>
                    <span class="emoji-btn" onclick="addEmoji('💻')" title="Code">💻</span>
                    <span class="emoji-btn" onclick="addEmoji('🐛')" title="Bug">🐛</span>
                    <span class="emoji-btn" onclick="addEmoji('🎯')" title="Objectif">🎯</span>
                    <span class="emoji-btn" onclick="addEmoji('⭐')" title="Etoile">⭐</span>
                    <span class="emoji-btn" onclick="addEmoji('😂')" title="MDR">😂</span>
                    <span class="emoji-btn" onclick="addEmoji('🤔')" title="Reflexion">🤔</span>
                    <span class="emoji-btn" onclick="addEmoji('👀')" title="Regarder">👀</span>
                    <span class="emoji-btn" onclick="addEmoji('💪')" title="Force">💪</span>
                </div>
                <div class="input-footer">
                    <div class="project-path">
                        <span>📁</span>
                        <input type="text" id="projectPath" value="{{ project_path }}" onchange="updateProjectPath(this.value)" title="Chemin du projet">
                    </div>
                    <div class="voice-status" id="voiceStatus">
                        <span>🔇</span> Voix desactivee
                    </div>
                </div>
            </div>
        </div>
    </main>
    
    <!-- Status bar pour indiquer l'etat -->
    <div class="status-bar" id="statusBar">
        <div class="spinner"></div>
        <span id="statusText">Cody reflechit...</span>
    </div>
    
    <script>
        const messagesEl = document.getElementById('messages');
        const inputEl = document.getElementById('input');
        const sendBtn = document.getElementById('sendBtn');
        const modelSelect = document.getElementById('modelSelect');
        const micBtn = document.getElementById('micBtn');
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceStatus = document.getElementById('voiceStatus');
        const statusBar = document.getElementById('statusBar');
        const statusText = document.getElementById('statusText');
        
        let isRecording = false;
        let mediaRecorder = null;
        let audioChunks = [];
        let voiceEnabled = false; // Desactive par defaut (TTS peut ne pas etre disponible)
        let notifEnabled = true;
        
        // Son de notification (base64 encoded beep)
        const notifSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1sbW1ub3BtcnN2eX+DhoqNjo+PkI+QkZGRkZCPj42LiYeFgoB+fHp4dXNxbm1samhmZGJgXl1bWVhWVFNSUE9OTUxLSkhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQEBAQEBAgIDBAQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==');
        
        // Charger le compteur de memoire au demarrage
        async function loadMemoryCount() {
            try {
                const response = await fetch('/api/memory-count');
                const data = await response.json();
                updateMemoryCount(data.count || 0);
            } catch (e) {
                console.log('Memoire non chargee');
            }
        }
        loadMemoryCount();
        
        // Demander permission pour les notifications
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Fonction pour jouer le son et afficher notification
        function playNotification(message) {
            if (!notifEnabled) return;
            
            // Jouer le son
            notifSound.play().catch(() => {});
            
            // Notification navigateur si permission accordee
            if ('Notification' in window && Notification.permission === 'granted') {
                const notif = new Notification('Cody', {
                    body: message || 'Reponse prete !',
                    icon: '🤖',
                    silent: true
                });
                setTimeout(() => notif.close(), 4000);
            }
        }
        
        // Fonction pour ajouter un emoji
        function addEmoji(emoji) {
            const cursorPos = inputEl.selectionStart;
            const textBefore = inputEl.value.substring(0, cursorPos);
            const textAfter = inputEl.value.substring(cursorPos);
            inputEl.value = textBefore + emoji + textAfter;
            inputEl.focus();
            inputEl.selectionStart = inputEl.selectionEnd = cursorPos + emoji.length;
        }
        
        // Fonctions pour la barre de status
        function showStatus(text) {
            statusText.textContent = text;
            statusBar.classList.add('visible');
        }
        
        function hideStatus() {
            statusBar.classList.remove('visible');
        }
        
        // Auto-resize textarea
        inputEl.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });
        
        // Enter to send
        inputEl.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        async function sendMessage() {
            const message = inputEl.value.trim();
            if (!message) return;
            
            // Add user message
            addMessage('user', message);
            inputEl.value = '';
            inputEl.style.height = 'auto';
            sendBtn.disabled = true;
            
            // Show typing indicator and status bar
            const typingEl = addTyping();
            showStatus('Cody reflechit...');
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        model: modelSelect.value
                    })
                });
                
                const data = await response.json();
                typingEl.remove();
                hideStatus();
                addMessage('assistant', data.response);
                
                // Notification sonore + push
                playNotification('Reponse prete !');
                
                // Update memory indicator
                if (data.history_count !== undefined) {
                    updateMemoryCount(data.history_count);
                }
                
                // Speak the response if voice is enabled
                if (voiceEnabled && data.response) {
                    speakText(data.response);
                }
            } catch (error) {
                typingEl.remove();
                hideStatus();
                addMessage('assistant', '❌ Erreur de connexion. Verifie que l agent est bien lance.');
            }
            
            sendBtn.disabled = false;
            inputEl.focus();
            scrollToBottom();
        }
        
        function scrollToBottom() {
            setTimeout(() => {
                messagesEl.scrollTo({
                    top: messagesEl.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
        
        function updateMemoryCount(count) {
            const memoryCountEl = document.getElementById('memoryCount');
            if (memoryCountEl) {
                memoryCountEl.textContent = count;
                // Animation flash
                memoryCountEl.parentElement.style.animation = 'none';
                setTimeout(() => {
                    memoryCountEl.parentElement.style.animation = 'pulse 0.5s ease';
                }, 10);
            }
        }
        
        function addMessage(role, content) {
            const div = document.createElement('div');
            div.className = `message ${role}`;
            div.innerHTML = `
                <div class="message-wrapper">
                    <div class="avatar">${role === 'assistant' ? '🤖' : '👤'}</div>
                    <div class="content">${formatContent(content)}</div>
                </div>
            `;
            messagesEl.appendChild(div);
            scrollToBottom();
        }
        
        function addTyping() {
            const div = document.createElement('div');
            div.className = 'message assistant';
            div.innerHTML = `
                <div class="message-wrapper">
                    <div class="avatar">🤖</div>
                    <div class="content">
                        <div class="typing-container">
                            <div class="typing-dots"><span></span><span></span><span></span></div>
                            <span class="typing-text">Cody ecrit...</span>
                        </div>
                    </div>
                </div>
            `;
            messagesEl.appendChild(div);
            scrollToBottom();
            return div;
        }
        
        function formatContent(content) {
            if (!content) return '';
            let result = content;
            result = result.split('```').map((part, i) => {
                if (i % 2 === 1) return '<pre><code>' + part + '</code></pre>';
                return part;
            }).join('');
            result = result.split('`').map((part, i) => {
                if (i % 2 === 1) return '<code>' + part + '</code>';
                return part;
            }).join('');
            result = result.split('**').map((part, i) => {
                if (i % 2 === 1) return '<strong>' + part + '</strong>';
                return part;
            }).join('');
            result = result.replace(/\n/g, '<br>');
            return result;
        }
        
        function clearChat() {
            fetch('/api/clear', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    updateMemoryCount(0);
                });
            messagesEl.innerHTML = '';
            addMessage('assistant', 'Conversation effacee. Comment puis-je t aider ?');
        }
        
        function toggleNotif() {
            notifEnabled = !notifEnabled;
            const notifBtn = document.getElementById('notifBtn');
            notifBtn.innerHTML = notifEnabled ? '<span>🔔</span>' : '<span>🔕</span>';
            notifBtn.title = notifEnabled ? 'Notifications activees' : 'Notifications desactivees';
        }
        
        function updateProjectPath(path) {
            fetch('/api/project-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path })
            });
        }
        
        function showSettings() {
            alert('Configuration: Modifie le fichier .env pour changer les cles API. Change le chemin du projet ci-dessous. Selectionne le modele dans le menu.');
        }
        
        // ============ VOICE FUNCTIONS ============
        
        function toggleVoice() {
            voiceEnabled = !voiceEnabled;
            voiceBtn.textContent = voiceEnabled ? '🔊' : '🔇';
            voiceStatus.textContent = voiceEnabled ? '🔊 Voix activee' : '🔇 Voix desactivee';
            voiceStatus.style.color = voiceEnabled ? '#22c55e' : '#94a3b8';
        }
        
        async function toggleRecording() {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        }
        
        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = (e) => {
                    audioChunks.push(e.data);
                };
                
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    await sendAudioToServer(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };
                
                mediaRecorder.start();
                isRecording = true;
                micBtn.classList.add('recording');
                micBtn.textContent = '⏹️';
            } catch (err) {
                alert('Erreur micro: ' + err.message);
            }
        }
        
        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                micBtn.classList.remove('recording');
                micBtn.textContent = '🎤';
            }
        }
        
        async function sendAudioToServer(audioBlob) {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            try {
                addMessage('user', '🎤 [Message vocal en cours de transcription...]');
                
                const response = await fetch('/api/speech-to-text', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (data.text) {
                    // Remove placeholder and add real message
                    messagesEl.lastChild.remove();
                    inputEl.value = data.text;
                    sendMessage();
                }
            } catch (err) {
                console.error('STT Error:', err);
            }
        }
        
        async function speakText(text) {
            if (!voiceEnabled) return;
            
            try {
                const response = await fetch('/api/text-to-speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text })
                });
                
                if (response.ok) {
                    const audioBlob = await response.blob();
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    audio.play();
                }
            } catch (err) {
                console.error('TTS Error:', err);
            }
        }
        
        // Focus input on load
        inputEl.focus();
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE, project_path=config.PROJECT_PATH)

@app.route('/api/chat', methods=['POST'])
def chat():
    import asyncio
    data = request.json
    message = data.get('message', '')
    model = data.get('model', config.DEFAULT_MODEL)
    
    # Log pour debug
    history_count = llm.get_history_length()
    console.print(f"[dim]📝 Historique: {history_count} messages[/dim]")
    
    # Run async function in sync context
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        response = loop.run_until_complete(llm.chat(message, model))
    finally:
        loop.close()
    
    new_count = llm.get_history_length()
    return jsonify({
        "response": response,
        "history_count": new_count
    })

@app.route('/api/clear', methods=['POST'])
def clear():
    old_count = llm.get_history_length()
    llm.clear_history()
    console.print(f"[yellow]🗑️ Historique effacé ({old_count} messages supprimés)[/yellow]")
    return jsonify({"success": True, "messages_cleared": old_count})

@app.route('/api/memory-count', methods=['GET'])
def get_memory_count():
    """Obtenir le nombre de messages en mémoire"""
    count = session_manager.get_message_count()
    return jsonify({"count": count})

@app.route('/api/history', methods=['GET'])
def get_history():
    """Obtenir l'historique de conversation (pour debug)"""
    history = llm.conversation_history
    return jsonify({
        "count": len(history),
        "messages": [{"role": m["role"], "preview": m["content"][:100] + "..." if len(m["content"]) > 100 else m["content"]} for m in history[-10:]]
    })

@app.route('/api/project-path', methods=['POST'])
def set_project_path():
    data = request.json
    path = data.get('path', '')
    if os.path.isdir(path):
        config.PROJECT_PATH = path
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Chemin invalide"})

@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    """Convertir audio en texte via OpenAI Whisper"""
    import asyncio
    import tempfile
    
    if 'audio' not in request.files:
        return jsonify({"error": "Pas de fichier audio"}), 400
    
    audio_file = request.files['audio']
    
    try:
        from emergentintegrations.llm.stt import transcribe_audio
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name
        
        # Transcribe
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            text = loop.run_until_complete(
                transcribe_audio(api_key=config.EMERGENT_API_KEY, audio_path=tmp_path)
            )
        finally:
            loop.close()
            os.unlink(tmp_path)
        
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    """Convertir texte en audio via OpenAI TTS"""
    import asyncio
    import tempfile
    
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({"error": "Pas de texte"}), 400
    
    # Limit text length for TTS
    if len(text) > 500:
        text = text[:500] + "..."
    
    # Verifier si la cle API est disponible
    if not config.EMERGENT_API_KEY:
        return jsonify({"error": "Cle API non configuree"}), 503
    
    try:
        from emergentintegrations.llm.tts import generate_speech
        
        # Generate speech
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
            tmp_path = tmp.name
        
        try:
            loop.run_until_complete(
                generate_speech(
                    api_key=config.EMERGENT_API_KEY,
                    text=text,
                    output_path=tmp_path,
                    voice="alloy"
                )
            )
        finally:
            loop.close()
        
        # Read and return audio
        with open(tmp_path, 'rb') as f:
            audio_data = f.read()
        os.unlink(tmp_path)
        
        return Response(audio_data, mimetype='audio/mpeg')
    except ImportError:
        console.print("[yellow]TTS non disponible - module manquant[/yellow]")
        return jsonify({"error": "TTS non disponible"}), 503
    except Exception as e:
        console.print(f"[red]Erreur TTS: {e}[/red]")
        return jsonify({"error": str(e)}), 500

# ============== MAIN ==============

def main():
    console.print("\n[bold blue]🤖 CODE AGENT[/bold blue]")
    console.print(f"[dim]Version {VERSION} - Ton assistant de développement personnel[/dim]\n")
    
    # Vérifier les mises à jour
    new_version = check_for_updates()
    if new_version:
        response = input(f"⬆️  Version {new_version} disponible. Mettre à jour? (o/n): ")
        if response.lower() in ['o', 'oui', 'y', 'yes']:
            if auto_update(new_version):
                sys.exit(0)  # Demander à l'utilisateur de relancer
    else:
        console.print("[green]✓[/green] Agent à jour")
    
    # Check for API key
    if not any([config.EMERGENT_API_KEY, config.OPENAI_API_KEY, config.ANTHROPIC_API_KEY]):
        console.print("[yellow]⚠️  Aucune clé API configurée![/yellow]")
        console.print("Copie .env.example en .env et ajoute ta clé.\n")
    
    console.print(f"[green]✓[/green] Projet: {config.PROJECT_PATH}")
    console.print(f"[green]✓[/green] Modèle: {config.DEFAULT_MODEL}")
    console.print(f"[green]✓[/green] Interface: http://localhost:{config.PORT}\n")
    
    # Open browser after short delay
    def open_browser():
        time.sleep(1.5)
        webbrowser.open(f'http://localhost:{config.PORT}')
    
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Run Flask
    console.print("[dim]Appuie sur Ctrl+C pour quitter[/dim]\n")
    app.run(host='127.0.0.1', port=config.PORT, debug=False, use_reloader=False)

if __name__ == '__main__':
    import asyncio
    # Patch Flask to work with async
    from flask import Flask
    import nest_asyncio
    try:
        nest_asyncio.apply()
    except:
        pass
    main()
