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

# ============== LLM CLIENT ==============

class LLMClient:
    """Client pour communiquer avec les LLMs"""
    
    SYSTEM_PROMPT = """Tu es Code Agent, un assistant de développement expert.

Tu peux:
- Lire et écrire des fichiers
- Exécuter des commandes shell
- Analyser et débugger du code
- Expliquer des concepts techniques
- Aider à déployer des applications

Quand l'utilisateur te demande quelque chose qui nécessite une action, tu dois utiliser les outils disponibles.

FORMAT DE RÉPONSE POUR LES ACTIONS:
Si tu dois effectuer une action, réponds avec un bloc JSON comme ceci:
```action
{"tool": "nom_outil", "params": {"param1": "valeur1"}}
```

OUTILS DISPONIBLES:
- read_file: {"path": "chemin/du/fichier"} - Lire un fichier
- write_file: {"path": "chemin", "content": "contenu"} - Écrire un fichier
- execute_command: {"command": "commande bash"} - Exécuter une commande
- list_files: {"pattern": "**/*.py"} - Lister des fichiers
- search_in_files: {"query": "texte", "file_pattern": "**/*"} - Rechercher
- get_project_structure: {} - Voir la structure du projet

Tu peux enchaîner plusieurs actions en les séparant.
Après chaque action, explique ce que tu as fait et le résultat.

Réponds toujours en français. Sois concis mais complet."""

    def __init__(self):
        self.conversation_history = []
    
    async def chat(self, message: str, model: str = None) -> str:
        """Envoyer un message et obtenir une réponse"""
        model = model or config.DEFAULT_MODEL
        
        self.conversation_history.append({"role": "user", "content": message})
        
        # Determine which API to use
        if config.EMERGENT_API_KEY:
            response = await self._call_emergent(model)
        elif 'claude' in model.lower() and config.ANTHROPIC_API_KEY:
            response = await self._call_anthropic(model)
        elif config.OPENAI_API_KEY:
            response = await self._call_openai(model)
        else:
            response = "❌ Aucune clé API configurée. Configure EMERGENT_API_KEY, OPENAI_API_KEY ou ANTHROPIC_API_KEY dans le fichier .env"
        
        self.conversation_history.append({"role": "assistant", "content": response})
        
        # Process any actions in the response
        response = await self._process_actions(response)
        
        return response
    
    async def _call_emergent(self, model: str) -> str:
        """Appeler l'API Emergent via emergentintegrations"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            import uuid
            
            # Map model names
            if 'gpt-5' in model.lower() or 'gpt-4o' in model.lower():
                provider, model_name = "openai", "gpt-4o"
            elif 'gpt-4o-mini' in model.lower():
                provider, model_name = "openai", "gpt-4o-mini"
            elif 'claude' in model.lower():
                provider, model_name = "anthropic", "claude-sonnet-4-20250514"
            else:
                provider, model_name = "openai", "gpt-4o"
            
            # Create chat instance with session_id
            chat = LlmChat(
                api_key=config.EMERGENT_API_KEY,
                session_id=str(uuid.uuid4()),
                system_message=self.SYSTEM_PROMPT
            ).with_model(provider, model_name)
            
            # Send current message
            last_msg = self.conversation_history[-1]["content"] if self.conversation_history else ""
            response = await chat.send_message(UserMessage(text=last_msg))
            
            return response
            
        except ImportError:
            return "❌ Module emergentintegrations non installé. Lance: pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/"
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
        self.conversation_history = []

llm = LLMClient()

# ============== WEB INTERFACE ==============

HTML_TEMPLATE = r'''
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤖 Code Agent</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --bg-tertiary: #334155;
            --accent: #3b82f6;
            --accent-hover: #2563eb;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --border: #475569;
            --success: #22c55e;
            --error: #ef4444;
        }
        
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        header {
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--accent), #8b5cf6);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        
        .logo-text { font-weight: 700; font-size: 1.25rem; }
        .logo-sub { font-size: 0.75rem; color: var(--text-secondary); }
        
        .header-actions {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }
        
        select, button {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            color: var(--text-primary);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.875rem;
        }
        
        button:hover { background: var(--accent); }
        
        .status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--success);
        }
        
        main {
            flex: 1;
            display: flex;
            flex-direction: column;
            max-width: 1000px;
            margin: 0 auto;
            width: 100%;
            padding: 1rem;
        }
        
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 1rem 0;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .message {
            display: flex;
            gap: 0.75rem;
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .message.user { flex-direction: row-reverse; }
        
        .avatar {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 1rem;
        }
        
        .message.assistant .avatar { background: linear-gradient(135deg, var(--accent), #8b5cf6); }
        .message.user .avatar { background: var(--bg-tertiary); }
        
        .content {
            max-width: 80%;
            background: var(--bg-secondary);
            padding: 1rem;
            border-radius: 12px;
            line-height: 1.6;
        }
        
        .message.user .content { background: var(--accent); }
        
        .content pre {
            background: var(--bg-primary);
            padding: 0.75rem;
            border-radius: 6px;
            overflow-x: auto;
            margin: 0.5rem 0;
            font-family: 'Fira Code', monospace;
            font-size: 0.85rem;
        }
        
        .content code {
            background: var(--bg-tertiary);
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
            font-family: 'Fira Code', monospace;
            font-size: 0.9em;
        }
        
        .content pre code { background: none; padding: 0; }
        
        .typing {
            display: flex;
            gap: 4px;
            padding: 0.5rem;
        }
        
        .typing span {
            width: 8px;
            height: 8px;
            background: var(--text-secondary);
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }
        
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1); }
        }
        
        .input-area {
            padding: 1rem;
            background: var(--bg-secondary);
            border-radius: 16px;
            margin-top: auto;
        }
        
        .input-wrapper {
            display: flex;
            gap: 0.75rem;
        }
        
        textarea {
            flex: 1;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 0.875rem;
            color: var(--text-primary);
            font-size: 1rem;
            resize: none;
            min-height: 50px;
            max-height: 200px;
            font-family: inherit;
        }
        
        textarea:focus { outline: none; border-color: var(--accent); }
        textarea::placeholder { color: var(--text-secondary); }
        
        .send-btn {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            background: var(--accent);
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .send-btn:hover { background: var(--accent-hover); transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        
        .voice-btn {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            font-size: 1.25rem;
        }
        
        .voice-btn:hover { background: var(--accent); border-color: var(--accent); }
        .voice-btn.recording { background: #ef4444; border-color: #ef4444; animation: pulse 1s infinite; }
        .voice-btn.disabled { opacity: 0.5; }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .project-path {
            margin-top: 0.75rem;
            padding: 0.5rem 0.75rem;
            background: var(--bg-tertiary);
            border-radius: 8px;
            font-size: 0.8rem;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .project-path input {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-family: monospace;
        }
        
        .project-path input:focus { outline: none; }
        
        /* Markdown styling */
        .content h1, .content h2, .content h3 { margin: 0.5rem 0; }
        .content ul, .content ol { margin-left: 1.5rem; }
        .content p { margin: 0.5rem 0; }
        .content strong { color: #fff; }
    </style>
</head>
<body>
    <header>
        <div class="logo">
            <div class="logo-icon">🤖</div>
            <div>
                <div class="logo-text">Code Agent</div>
                <div class="logo-sub">Ton assistant de développement</div>
            </div>
        </div>
        <div class="header-actions">
            <div class="status">
                <div class="status-dot"></div>
                <span>Connecté</span>
            </div>
            <select id="modelSelect">
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-sonnet">Claude Sonnet</option>
            </select>
            <button onclick="clearChat()">🗑️ Effacer</button>
            <button onclick="showSettings()">⚙️</button>
        </div>
    </header>
    
    <main>
        <div class="messages" id="messages">
            <div class="message assistant">
                <div class="avatar">🤖</div>
                <div class="content">
                    <strong>Bonjour ! Je suis Code Agent.</strong><br><br>
                    Je suis ton assistant de développement. Je peux :<br>
                    • 📁 Lire et écrire des fichiers<br>
                    • 🖥️ Exécuter des commandes<br>
                    • 🔍 Chercher dans ton code<br>
                    • 🐛 Débugger et corriger<br><br>
                    <em>Dis-moi ce dont tu as besoin !</em>
                </div>
            </div>
        </div>
        
        <div class="input-area">
            <div class="input-wrapper">
                <button class="voice-btn" onclick="toggleRecording()" id="micBtn" title="Parler">🎤</button>
                <textarea id="input" placeholder="Tape ta demande ou clique sur 🎤 pour parler..." rows="1"></textarea>
                <button class="send-btn" onclick="sendMessage()" id="sendBtn">➤</button>
                <button class="voice-btn" onclick="toggleVoice()" id="voiceBtn" title="Activer/Desactiver la voix">🔊</button>
            </div>
            <div class="project-path">
                📁 Projet: <input type="text" id="projectPath" value="{{ project_path }}" onchange="updateProjectPath(this.value)">
                <span id="voiceStatus" style="margin-left: 10px; font-size: 0.75rem; color: #22c55e;">🔊 Voix activee</span>
            </div>
        </div>
    </main>
    
    <script>
        const messagesEl = document.getElementById('messages');
        const inputEl = document.getElementById('input');
        const sendBtn = document.getElementById('sendBtn');
        const modelSelect = document.getElementById('modelSelect');
        const micBtn = document.getElementById('micBtn');
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceStatus = document.getElementById('voiceStatus');
        
        let isRecording = false;
        let mediaRecorder = null;
        let audioChunks = [];
        let voiceEnabled = true;
        
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
            
            // Show typing indicator
            const typingEl = addTyping();
            
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
                addMessage('assistant', data.response);
                
                // Speak the response if voice is enabled
                if (voiceEnabled && data.response) {
                    speakText(data.response);
                }
            } catch (error) {
                typingEl.remove();
                addMessage('assistant', '❌ Erreur de connexion. Vérifie que l\'agent est bien lancé.');
            }
            
            sendBtn.disabled = false;
            inputEl.focus();
        }
        
        function addMessage(role, content) {
            const div = document.createElement('div');
            div.className = `message ${role}`;
            div.innerHTML = `
                <div class="avatar">${role === 'assistant' ? '🤖' : '👤'}</div>
                <div class="content">${formatContent(content)}</div>
            `;
            messagesEl.appendChild(div);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }
        
        function addTyping() {
            const div = document.createElement('div');
            div.className = 'message assistant';
            div.innerHTML = `
                <div class="avatar">🤖</div>
                <div class="content"><div class="typing"><span></span><span></span><span></span></div></div>
            `;
            messagesEl.appendChild(div);
            messagesEl.scrollTop = messagesEl.scrollHeight;
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
            fetch('/api/clear', { method: 'POST' });
            messagesEl.innerHTML = '';
            addMessage('assistant', 'Conversation effacee. Comment puis-je t aider ?');
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
    
    # Run async function in sync context
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        response = loop.run_until_complete(llm.chat(message, model))
    finally:
        loop.close()
    
    return jsonify({"response": response})

@app.route('/api/clear', methods=['POST'])
def clear():
    llm.clear_history()
    return jsonify({"success": True})

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
    except Exception as e:
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
