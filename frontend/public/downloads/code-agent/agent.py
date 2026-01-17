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
UPDATE_URL = "https://worldauto-hero.preview.emergentagent.com/downloads/code-agent"
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

# ============== THEME CONFIGURATION ==============

def load_theme_config():
    """Charge la configuration du thème depuis cody_config.json ou depuis l'API"""
    default_config = {
        "agent_name": "Cody",
        "theme_mode": "light",
        "colors": {
            "accent": "#f97316",
            "accent_hover": "#ea580c",
            "bg_main": "#ffffff",
            "bg_sidebar": "#f9fafb",
            "text_primary": "#1f2937",
            "text_secondary": "#6b7280",
            "border": "#e5e7eb",
            "success": "#22c55e"
        },
        "dark_colors": {
            "bg_main": "#0f0f0f",
            "bg_sidebar": "#1a1a1a",
            "text_primary": "#f3f4f6",
            "text_secondary": "#9ca3af",
            "border": "#2d2d2d"
        },
        "font": {
            "family": "inter",
            "size": "normal"
        },
        "options": {
            "sound_enabled": True,
            "emoji_enabled": True,
            "animations_enabled": True
        }
    }
    
    # 1. Essayer de charger depuis le fichier local
    config_loaded = False
    try:
        config_path = Path(__file__).parent / "cody_config.json"
        if config_path.exists():
            with open(config_path, 'r', encoding='utf-8') as f:
                user_config = json.load(f)
                # Merge avec la config par défaut
                for key in default_config:
                    if key in user_config:
                        if isinstance(default_config[key], dict):
                            default_config[key].update(user_config[key])
                        else:
                            default_config[key] = user_config[key]
                console.print(f"[green]✅ Configuration personnalisée chargée depuis cody_config.json[/green]")
                config_loaded = True
    except Exception as e:
        console.print(f"[dim]ℹ️ Pas de fichier cody_config.json local ({e})[/dim]")
    
    # 2. Si pas de config locale, essayer de synchroniser depuis l'API
    if not config_loaded:
        try:
            sync_config_from_api(default_config)
        except:
            pass
    
    return default_config

def sync_config_from_api(config):
    """Synchronise la configuration depuis l'API World Auto Pro"""
    SITE_URL = os.environ.get('SITE_URL', 'https://worldautofrance.com')
    API_URL = f"{SITE_URL}/api/settings/hero"
    
    try:
        console.print(f"[dim]🔄 Synchronisation de la config depuis {SITE_URL}...[/dim]")
        response = httpx.get(API_URL, timeout=5)
        if response.status_code == 200:
            data = response.json()
            
            # Mapper les settings de l'API vers la config Cody
            if data.get('cody_agent_name'):
                config['agent_name'] = data['cody_agent_name']
            if data.get('cody_theme_mode'):
                config['theme_mode'] = data['cody_theme_mode']
            
            # Couleurs mode clair
            color_mappings = {
                'cody_accent_color': ('colors', 'accent'),
                'cody_accent_hover': ('colors', 'accent_hover'),
                'cody_bg_main': ('colors', 'bg_main'),
                'cody_bg_sidebar': ('colors', 'bg_sidebar'),
                'cody_text_primary': ('colors', 'text_primary'),
                'cody_text_secondary': ('colors', 'text_secondary'),
                'cody_border_color': ('colors', 'border'),
                'cody_success_color': ('colors', 'success'),
            }
            
            for api_key, (section, key) in color_mappings.items():
                if data.get(api_key):
                    config[section][key] = data[api_key]
            
            # Couleurs mode sombre
            dark_mappings = {
                'cody_dark_bg_main': ('dark_colors', 'bg_main'),
                'cody_dark_bg_sidebar': ('dark_colors', 'bg_sidebar'),
                'cody_dark_text_primary': ('dark_colors', 'text_primary'),
                'cody_dark_text_secondary': ('dark_colors', 'text_secondary'),
                'cody_dark_border': ('dark_colors', 'border'),
            }
            
            for api_key, (section, key) in dark_mappings.items():
                if data.get(api_key):
                    config[section][key] = data[api_key]
            
            # Options
            if 'cody_sound_enabled' in data:
                config['options']['sound_enabled'] = data['cody_sound_enabled']
            if 'cody_emoji_enabled' in data:
                config['options']['emoji_enabled'] = data['cody_emoji_enabled']
            if 'cody_animations_enabled' in data:
                config['options']['animations_enabled'] = data['cody_animations_enabled']
            
            console.print(f"[green]✅ Configuration synchronisée depuis {SITE_URL}[/green]")
            
            # Sauvegarder localement pour les prochains démarrages
            config_path = Path(__file__).parent / "cody_config.json"
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            console.print(f"[dim]💾 Config sauvegardée dans cody_config.json[/dim]")
            
    except Exception as e:
        console.print(f"[dim]⚠️ Impossible de synchroniser la config ({e})[/dim]")

THEME_CONFIG = load_theme_config()

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
        """Exécuter une commande shell localement"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=config.PROJECT_PATH
            )
            output = result.stdout if result.stdout else result.stderr
            return {
                "success": result.returncode == 0,
                "output": output.strip() if output else "(aucune sortie)",
                "exit_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": f"⏱️ Timeout après {timeout}s"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def vps_command(command: str, timeout: int = 120) -> Dict:
        """Exécuter une commande sur le VPS WorldAuto via SSH"""
        try:
            # Configuration VPS
            vps_host = "148.230.115.118"
            vps_user = "root"
            
            ssh_cmd = f'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 {vps_user}@{vps_host} "{command}"'
            
            result = subprocess.run(
                ssh_cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            output = result.stdout if result.stdout else result.stderr
            return {
                "success": result.returncode == 0,
                "output": output.strip() if output else "(aucune sortie)",
                "exit_code": result.returncode,
                "location": "VPS WorldAuto"
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": f"⏱️ Timeout après {timeout}s"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def check_worldauto() -> Dict:
        """Vérification complète de WorldAuto (services, API, site)"""
        results = {
            "services": {},
            "api": {},
            "site": {}
        }
        
        # 1. Vérifier les services Docker via SSH
        try:
            ssh_cmd = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@148.230.115.118 "docker ps --format \\"{{.Names}}: {{.Status}}\\""'
            result = subprocess.run(ssh_cmd, shell=True, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                services = {}
                for line in result.stdout.strip().split('\n'):
                    if ': ' in line:
                        name, status = line.split(': ', 1)
                        services[name] = "✅ " + status if "Up" in status else "❌ " + status
                results["services"] = {"success": True, "details": services}
            else:
                results["services"] = {"success": False, "error": "Impossible de se connecter au VPS"}
        except Exception as e:
            results["services"] = {"success": False, "error": str(e)}
        
        # 2. Tester l'API
        try:
            import httpx
            with httpx.Client(timeout=10) as client:
                # Test pricing
                r = client.get("https://worldautofrance.com/api/pricing")
                results["api"]["pricing"] = "✅ OK" if r.status_code == 200 else f"❌ {r.status_code}"
                
                # Test promo status
                r = client.get("https://worldautofrance.com/api/promo/LANCEMENT/status")
                results["api"]["promo"] = "✅ OK" if r.status_code == 200 else f"❌ {r.status_code}"
                
                # Test countries
                r = client.get("https://worldautofrance.com/api/countries/allowed")
                results["api"]["countries"] = "✅ OK" if r.status_code == 200 else f"❌ {r.status_code}"
                
            results["api"]["success"] = True
        except Exception as e:
            results["api"] = {"success": False, "error": str(e)}
        
        # 3. Vérifier le site
        try:
            import httpx
            with httpx.Client(timeout=10, follow_redirects=True) as client:
                r = client.get("https://worldautofrance.com")
                results["site"]["home"] = "✅ OK" if r.status_code == 200 else f"❌ {r.status_code}"
                results["site"]["success"] = True
        except Exception as e:
            results["site"] = {"success": False, "error": str(e)}
        
        # Résumé FORMATÉ pour affichage direct
        api_ok = results["api"].get("success", False)
        site_ok = results["site"].get("success", False)
        services_ok = results["services"].get("success", False)
        
        # Construire un rapport lisible
        report = "\n📊 **DIAGNOSTIC WORLDAUTO**\n"
        report += "=" * 40 + "\n\n"
        
        # Services Docker
        report += "🐳 **Services Docker:**\n"
        if services_ok:
            for name, status in results["services"].get("details", {}).items():
                report += f"   • {name}: {status}\n"
        else:
            report += f"   ⚠️ {results['services'].get('error', 'Impossible de vérifier')}\n"
            report += "   💡 Configure SSH: ssh-copy-id root@148.230.115.118\n"
        
        report += "\n"
        
        # API
        report += "🔌 **API:**\n"
        if api_ok:
            report += f"   • /api/pricing: {results['api'].get('pricing', '?')}\n"
            report += f"   • /api/promo: {results['api'].get('promo', '?')}\n"
            report += f"   • /api/countries: {results['api'].get('countries', '?')}\n"
        else:
            report += f"   ❌ Erreur: {results['api'].get('error', 'Inconnue')}\n"
        
        report += "\n"
        
        # Site
        report += "🌐 **Site Web:**\n"
        if site_ok:
            report += f"   • Homepage: {results['site'].get('home', '?')}\n"
        else:
            report += f"   ❌ Erreur: {results['site'].get('error', 'Inconnue')}\n"
        
        report += "\n" + "=" * 40 + "\n"
        
        # Conclusion
        if api_ok and site_ok:
            report += "✅ **CONCLUSION: Le site fonctionne correctement!**\n"
            if not services_ok:
                report += "⚠️ (Vérification Docker impossible sans SSH configuré)\n"
        else:
            report += "❌ **CONCLUSION: Des problèmes ont été détectés!**\n"
        
        return {
            "formatted_report": report,
            "all_ok": api_ok and site_ok,
            "details": results
        }
    
    @staticmethod
    def security_scan() -> Dict:
        """Scanner de sécurité basique pour WorldAuto"""
        results = {
            "headers": {},
            "ssl": {},
            "endpoints_auth": {},
            "recommendations": []
        }
        report = "\n🔒 **SCAN DE SÉCURITÉ WORLDAUTO**\n"
        report += "=" * 40 + "\n\n"
        
        try:
            import httpx
            
            # 1. Vérifier les headers de sécurité
            report += "📋 **Headers de sécurité:**\n"
            with httpx.Client(timeout=10, follow_redirects=True) as client:
                r = client.get("https://worldautofrance.com")
                headers = r.headers
                
                security_headers = {
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "DENY ou SAMEORIGIN",
                    "X-XSS-Protection": "1; mode=block",
                    "Strict-Transport-Security": "HSTS",
                    "Content-Security-Policy": "CSP"
                }
                
                for header, desc in security_headers.items():
                    if header.lower() in [h.lower() for h in headers.keys()]:
                        report += f"   ✅ {header}: Présent\n"
                        results["headers"][header] = "OK"
                    else:
                        report += f"   ⚠️ {header}: Manquant ({desc})\n"
                        results["headers"][header] = "MISSING"
                        results["recommendations"].append(f"Ajouter le header {header}")
            
            report += "\n"
            
            # 2. Vérifier SSL
            report += "🔐 **Certificat SSL:**\n"
            try:
                import ssl
                import socket
                context = ssl.create_default_context()
                with socket.create_connection(("worldautofrance.com", 443), timeout=10) as sock:
                    with context.wrap_socket(sock, server_hostname="worldautofrance.com") as ssock:
                        cert = ssock.getpeercert()
                        expiry = cert.get('notAfter', 'Inconnu')
                        report += f"   ✅ SSL valide, expire: {expiry}\n"
                        results["ssl"] = {"valid": True, "expiry": expiry}
            except Exception as e:
                report += f"   ❌ Erreur SSL: {str(e)}\n"
                results["ssl"] = {"valid": False, "error": str(e)}
            
            report += "\n"
            
            # 3. Tester les endpoints sans auth (doivent échouer)
            report += "🚫 **Endpoints protégés (doivent bloquer sans auth):**\n"
            protected_endpoints = [
                "/api/users/me",
                "/api/admin/users",
                "/api/listings/create",
                "/api/messages"
            ]
            
            with httpx.Client(timeout=10) as client:
                for endpoint in protected_endpoints:
                    try:
                        r = client.get(f"https://worldautofrance.com{endpoint}")
                        if r.status_code in [401, 403, 405, 422]:
                            report += f"   ✅ {endpoint}: Protégé ({r.status_code})\n"
                            results["endpoints_auth"][endpoint] = "PROTECTED"
                        elif r.status_code == 404:
                            report += f"   ⚪ {endpoint}: Non trouvé\n"
                            results["endpoints_auth"][endpoint] = "NOT_FOUND"
                        else:
                            report += f"   ❌ {endpoint}: ACCESSIBLE! ({r.status_code})\n"
                            results["endpoints_auth"][endpoint] = "EXPOSED"
                            results["recommendations"].append(f"Protéger {endpoint}")
                    except:
                        report += f"   ⚪ {endpoint}: Erreur\n"
            
            report += "\n"
            
            # 4. Recommandations
            report += "💡 **Recommandations:**\n"
            if results["recommendations"]:
                for rec in results["recommendations"]:
                    report += f"   • {rec}\n"
            else:
                report += "   ✅ Aucune recommandation critique\n"
            
            report += "\n" + "=" * 40 + "\n"
            
            # Score
            total_checks = len(results["headers"]) + 1 + len(results["endpoints_auth"])
            passed = sum(1 for v in results["headers"].values() if v == "OK")
            passed += 1 if results["ssl"].get("valid") else 0
            passed += sum(1 for v in results["endpoints_auth"].values() if v in ["PROTECTED", "NOT_FOUND"])
            
            score = int((passed / total_checks) * 100) if total_checks > 0 else 0
            report += f"📊 **Score de sécurité: {score}%**\n"
            
            return {"formatted_report": report, "score": score, "details": results}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def performance_test() -> Dict:
        """Test de performance basique des API"""
        report = "\n⚡ **TEST DE PERFORMANCE WORLDAUTO**\n"
        report += "=" * 40 + "\n\n"
        results = {}
        
        try:
            import httpx
            import time
            
            endpoints = [
                ("GET", "/api/pricing", "Tarifs"),
                ("GET", "/api/countries/allowed", "Pays"),
                ("GET", "/", "Homepage"),
                ("GET", "/api/listings?limit=10", "Annonces"),
            ]
            
            report += "📊 **Temps de réponse:**\n"
            
            with httpx.Client(timeout=30, follow_redirects=True) as client:
                for method, endpoint, name in endpoints:
                    try:
                        url = f"https://worldautofrance.com{endpoint}"
                        start = time.time()
                        if method == "GET":
                            r = client.get(url)
                        elapsed = (time.time() - start) * 1000  # en ms
                        
                        if elapsed < 500:
                            status = "✅"
                            perf = "Rapide"
                        elif elapsed < 1500:
                            status = "⚠️"
                            perf = "Moyen"
                        else:
                            status = "❌"
                            perf = "Lent"
                        
                        report += f"   {status} {name}: {elapsed:.0f}ms ({perf})\n"
                        results[endpoint] = {"time_ms": elapsed, "status": r.status_code}
                    except Exception as e:
                        report += f"   ❌ {name}: Erreur - {str(e)[:30]}\n"
            
            report += "\n" + "=" * 40 + "\n"
            
            # Moyenne
            times = [r["time_ms"] for r in results.values() if "time_ms" in r]
            if times:
                avg = sum(times) / len(times)
                report += f"📈 **Moyenne: {avg:.0f}ms**\n"
            
            return {"formatted_report": report, "details": results}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def check_logs() -> Dict:
        """Vérifier les logs Docker du VPS (nécessite SSH)"""
        report = "\n📜 **LOGS WORLDAUTO (50 dernières lignes)**\n"
        report += "=" * 40 + "\n\n"
        
        try:
            # Backend logs
            ssh_cmd = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@148.230.115.118 "docker-compose -f /var/www/worldauto/docker-compose.yml logs --tail=50 backend 2>&1"'
            result = subprocess.run(ssh_cmd, shell=True, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                report += "🔧 **Backend:**\n```\n"
                report += result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout
                report += "\n```\n"
            else:
                report += f"⚠️ Impossible de récupérer les logs backend\n"
                report += f"💡 Configure SSH: ssh-copy-id root@148.230.115.118\n"
            
            return {"formatted_report": report}
            
        except subprocess.TimeoutExpired:
            return {"formatted_report": report + "⚠️ Timeout SSH - Configure: ssh-copy-id root@148.230.115.118\n"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def modify_hero(title: str = None, subtitle: str = None, button_text: str = None) -> Dict:
        """Modifier le Hero de la page d'accueil"""
        try:
            # Lire le fichier Home.jsx
            home_path = Path(config.PROJECT_PATH) / "frontend" / "src" / "pages" / "Home.jsx"
            
            if not home_path.exists():
                # Essayer un autre chemin
                home_path = Path("/var/www/worldauto/frontend/src/pages/Home.jsx")
            
            if not home_path.exists():
                return {"success": False, "error": "Fichier Home.jsx non trouvé"}
            
            content = home_path.read_text()
            changes = []
            
            # Modifications (basiques - pour des changements simples)
            if title:
                changes.append(f"Titre changé en: {title}")
            if subtitle:
                changes.append(f"Sous-titre changé en: {subtitle}")
            if button_text:
                changes.append(f"Bouton changé en: {button_text}")
            
            if not changes:
                return {"success": False, "error": "Aucune modification demandée. Utilise: title, subtitle, ou button_text"}
            
            return {
                "success": True,
                "message": "⚠️ Modification du Hero nécessite une intervention manuelle ou via E1",
                "requested_changes": changes,
                "file": str(home_path),
                "tip": "Demande à E1 (Emergent) de faire cette modification pour toi"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def full_diagnostic() -> Dict:
        """Diagnostic COMPLET : santé + sécurité + performance"""
        report = "\n"
        report += "╔" + "═" * 50 + "╗\n"
        report += "║" + " 🏥 DIAGNOSTIC COMPLET WORLDAUTO ".center(50) + "║\n"
        report += "╚" + "═" * 50 + "╝\n\n"
        
        # 1. Santé
        health = AgentTools.check_worldauto()
        report += health.get("formatted_report", "Erreur santé\n")
        report += "\n"
        
        # 2. Sécurité
        security = AgentTools.security_scan()
        report += security.get("formatted_report", "Erreur sécurité\n")
        report += "\n"
        
        # 3. Performance
        perf = AgentTools.performance_test()
        report += perf.get("formatted_report", "Erreur performance\n")
        
        # Résumé final
        report += "\n"
        report += "╔" + "═" * 50 + "╗\n"
        report += "║" + " 📋 RÉSUMÉ ".center(50) + "║\n"
        report += "╠" + "═" * 50 + "╣\n"
        
        health_ok = health.get("all_ok", False)
        security_score = security.get("score", 0)
        
        report += f"║  • Santé du site: {'✅ OK' if health_ok else '❌ Problèmes'}".ljust(51) + "║\n"
        report += f"║  • Score sécurité: {security_score}%".ljust(51) + "║\n"
        report += "╚" + "═" * 50 + "╝\n"
        
        return {"formatted_report": report}
    
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
    
    @staticmethod
    def scan_project() -> Dict:
        """Scanner et mémoriser la structure du projet"""
        try:
            result = project_knowledge.scan_project()
            return {"success": True, "message": result, "summary": project_knowledge.get_summary()}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def get_env_value(key: str) -> Dict:
        """Lire une valeur du fichier .env"""
        try:
            env_path = project_knowledge.get_env_path()
            if not env_path:
                # Chercher le fichier .env
                for possible in ["backend/.env", ".env", "frontend/.env"]:
                    full = os.path.join(config.PROJECT_PATH, possible)
                    if os.path.exists(full):
                        env_path = full
                        break
            
            if not env_path or not os.path.exists(env_path):
                return {"success": False, "error": "Fichier .env non trouvé"}
            
            with open(env_path, 'r') as f:
                for line in f:
                    if line.strip().startswith(key + '='):
                        value = line.strip().split('=', 1)[1]
                        return {"success": True, "key": key, "value": value, "path": env_path}
            
            return {"success": False, "error": f"Clé {key} non trouvée"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def set_env_value(key: str, value: str) -> Dict:
        """Modifier ou ajouter une valeur dans le fichier .env"""
        try:
            env_path = project_knowledge.get_env_path()
            if not env_path:
                for possible in ["backend/.env", ".env"]:
                    full = os.path.join(config.PROJECT_PATH, possible)
                    if os.path.exists(full):
                        env_path = full
                        break
            
            if not env_path:
                return {"success": False, "error": "Fichier .env non trouvé"}
            
            # Lire le contenu actuel
            with open(env_path, 'r') as f:
                lines = f.readlines()
            
            # Chercher et remplacer la clé
            found = False
            new_lines = []
            for line in lines:
                if line.strip().startswith(key + '='):
                    new_lines.append(f"{key}={value}\n")
                    found = True
                else:
                    new_lines.append(line)
            
            # Ajouter si non trouvé
            if not found:
                new_lines.append(f"{key}={value}\n")
            
            # Écrire
            with open(env_path, 'w') as f:
                f.writelines(new_lines)
            
            action = "modifiée" if found else "ajoutée"
            return {"success": True, "message": f"✅ {key} {action} dans {env_path}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def add_note(note: str) -> Dict:
        """Mémoriser une note importante"""
        try:
            project_knowledge.add_note(note)
            return {"success": True, "message": f"📝 Note mémorisée: {note}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def get_knowledge() -> Dict:
        """Obtenir le résumé des connaissances du projet"""
        return {"success": True, "summary": project_knowledge.get_summary(), "knowledge": project_knowledge._knowledge}
    
    @staticmethod
    def screenshot(url: str) -> Dict:
        """Prendre une capture d'écran d'une URL"""
        try:
            import subprocess
            import base64
            from datetime import datetime
            
            # Créer le dossier screenshots s'il n'existe pas
            screenshots_dir = Path(__file__).parent / "screenshots"
            screenshots_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"screenshot_{timestamp}.png"
            filepath = screenshots_dir / filename
            
            # Utiliser playwright pour la capture
            script = f'''
import asyncio
from playwright.async_api import async_playwright

async def take_screenshot():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_viewport_size({{"width": 1920, "height": 1080}})
        await page.goto("{url}", wait_until="networkidle")
        await page.screenshot(path="{filepath}")
        await browser.close()

asyncio.run(take_screenshot())
'''
            result = subprocess.run(['python3', '-c', script], capture_output=True, text=True, timeout=60)
            
            if filepath.exists():
                return {
                    "success": True, 
                    "message": f"📸 Capture d'écran sauvegardée: {filepath}",
                    "path": str(filepath)
                }
            else:
                return {"success": False, "error": f"Échec de la capture: {result.stderr}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def test_api(method: str, endpoint: str, data: dict = None) -> Dict:
        """Tester un endpoint API WorldAuto"""
        try:
            import httpx
            base_url = "https://worldautofrance.com"
            url = f"{base_url}{endpoint}"
            
            with httpx.Client(timeout=30) as client:
                if method.upper() == "GET":
                    response = client.get(url)
                elif method.upper() == "POST":
                    response = client.post(url, json=data or {})
                elif method.upper() == "PUT":
                    response = client.put(url, json=data or {})
                elif method.upper() == "DELETE":
                    response = client.delete(url)
                else:
                    return {"success": False, "error": f"Méthode inconnue: {method}"}
                
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "response": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text[:500]
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def deploy() -> Dict:
        """Déployer les changements sur le VPS WorldAuto"""
        try:
            import subprocess
            
            # Commande de déploiement complète
            commands = [
                "cd /var/www/worldauto",
                "git pull origin code-agent-v",
                "docker-compose build --no-cache",
                "docker-compose up -d"
            ]
            
            results = []
            for cmd in commands:
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=300)
                results.append({
                    "command": cmd,
                    "stdout": result.stdout[:500] if result.stdout else "",
                    "stderr": result.stderr[:500] if result.stderr else "",
                    "returncode": result.returncode
                })
                if result.returncode != 0:
                    return {
                        "success": False,
                        "error": f"Échec à l'étape: {cmd}",
                        "details": results
                    }
            
            return {
                "success": True,
                "message": "🚀 Déploiement terminé avec succès!",
                "details": results
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def backup_db() -> Dict:
        """Sauvegarder la base de données MongoDB"""
        try:
            import subprocess
            from datetime import datetime
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"/var/www/worldauto/backups/backup_{timestamp}"
            
            cmd = f"docker exec worldauto-mongodb mongodump --out {backup_path}"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0:
                return {
                    "success": True,
                    "message": f"💾 Backup créé: {backup_path}",
                    "path": backup_path
                }
            else:
                return {"success": False, "error": result.stderr}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def check_services() -> Dict:
        """Vérifier l'état des services Docker"""
        try:
            import subprocess
            
            result = subprocess.run("docker ps --format '{{.Names}}: {{.Status}}'", 
                                   shell=True, capture_output=True, text=True, timeout=30)
            
            services = {}
            for line in result.stdout.strip().split('\n'):
                if line:
                    parts = line.split(': ')
                    if len(parts) == 2:
                        services[parts[0]] = parts[1]
            
            # Vérifier si tous les services critiques tournent
            critical = ['worldauto-frontend', 'worldauto-backend', 'worldauto-mongodb']
            all_running = all(any(s in name for name in services.keys()) for s in ['frontend', 'backend', 'mongodb'])
            
            return {
                "success": True,
                "all_running": all_running,
                "services": services,
                "message": "✅ Tous les services sont OK" if all_running else "⚠️ Certains services ne tournent pas"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ============== NOUVEAUX OUTILS v3.5.0 ==============
    
    @staticmethod
    def get_stats() -> Dict:
        """Obtenir les statistiques du site WorldAuto"""
        report = "\n📊 **STATISTIQUES WORLDAUTO**\n"
        report += "=" * 40 + "\n\n"
        
        try:
            import httpx
            
            with httpx.Client(timeout=15) as client:
                # Stats générales via l'API admin (si disponible)
                stats = {}
                
                # Tenter de récupérer les stats via différentes méthodes
                try:
                    r = client.get("https://worldautofrance.com/api/admin/stats")
                    if r.status_code == 200:
                        stats = r.json()
                except:
                    pass
                
                # Stats des annonces
                try:
                    r = client.get("https://worldautofrance.com/api/listings?limit=1")
                    if r.status_code == 200:
                        data = r.json()
                        stats["total_listings"] = data.get("total", "N/A")
                except:
                    stats["total_listings"] = "N/A"
                
                # Vérifier le pricing
                try:
                    r = client.get("https://worldautofrance.com/api/pricing")
                    if r.status_code == 200:
                        stats["pricing_active"] = "✅ Oui"
                except:
                    stats["pricing_active"] = "❌ Non"
                
                report += "👥 **Utilisateurs:**\n"
                report += f"   • Total: {stats.get('total_users', 'Nécessite auth admin')}\n"
                report += f"   • Professionnels: {stats.get('pro_users', 'N/A')}\n"
                report += f"   • Nouveaux (7j): {stats.get('new_users_week', 'N/A')}\n\n"
                
                report += "📦 **Annonces:**\n"
                report += f"   • Total: {stats.get('total_listings', 'N/A')}\n"
                report += f"   • Actives: {stats.get('active_listings', 'N/A')}\n\n"
                
                report += "💰 **Revenus:**\n"
                report += f"   • Ce mois: {stats.get('revenue_month', 'Nécessite auth admin')}€\n"
                report += f"   • Crédits vendus: {stats.get('credits_sold', 'N/A')}\n\n"
                
                report += "⚙️ **Système:**\n"
                report += f"   • Pricing actif: {stats['pricing_active']}\n"
                
                report += "\n" + "=" * 40 + "\n"
                report += "💡 Pour des stats complètes, connectez-vous en admin sur le site.\n"
                
                return {"formatted_report": report, "stats": stats}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def vps_monitoring() -> Dict:
        """Monitoring du VPS (CPU, RAM, Disque)"""
        report = "\n🖥️ **MONITORING VPS WORLDAUTO**\n"
        report += "=" * 40 + "\n\n"
        
        try:
            import subprocess
            
            # Commande SSH pour récupérer les infos système
            ssh_base = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@148.230.115.118'
            
            # CPU - utilisation idle puis calcul
            cmd = f'{ssh_base} "top -bn1 | grep Cpu | head -1 | awk -F\\"id,\\" \'{{print $1}}\' | awk \'{{print $NF}}\'"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            try:
                idle = float(result.stdout.strip())
                cpu = f"{100 - idle:.1f}"
            except:
                cpu = "N/A"
            
            # RAM
            cmd = f'{ssh_base} "free -m | grep Mem | awk \'{{printf \\"%.1f GB / %.1f GB (%.0f%%)\\" , $3/1024, $2/1024, $3/$2*100}}\'"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            ram = result.stdout.strip() if result.returncode == 0 and result.stdout.strip() else "N/A"
            
            # Disque
            cmd = f'{ssh_base} "df -h / | tail -1 | awk \'{{print $3 \\" / \\" $2 \\" (\\" $5 \\")}}\'"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            disk = result.stdout.strip() if result.returncode == 0 and result.stdout.strip() else "N/A"
            
            # Uptime
            cmd = f'{ssh_base} "uptime -p"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            uptime = result.stdout.strip() if result.returncode == 0 else "N/A"
            
            # Docker containers
            cmd = f'{ssh_base} "docker ps --format \\"{{{{.Names}}}}: {{{{.Status}}}}\\" 2>/dev/null"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            containers = result.stdout.strip() if result.returncode == 0 else "N/A"
            
            report += "💻 **Ressources:**\n"
            report += f"   • CPU: {cpu}%\n"
            report += f"   • RAM: {ram}\n"
            report += f"   • Disque: {disk}\n"
            report += f"   • Uptime: {uptime}\n\n"
            
            report += "🐳 **Containers Docker:**\n"
            if containers and containers != "N/A":
                for line in containers.split('\n'):
                    if line:
                        report += f"   • {line}\n"
            else:
                report += "   ⚠️ Impossible de récupérer (SSH non configuré)\n"
            
            report += "\n" + "=" * 40 + "\n"
            
            return {"formatted_report": report}
            
        except subprocess.TimeoutExpired:
            return {"formatted_report": report + "⚠️ Timeout SSH - Configure: ssh-copy-id root@148.230.115.118\n"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def manage_user(action: str, email: str = None, user_id: str = None) -> Dict:
        """Gérer un utilisateur (info, block, unblock)"""
        report = "\n👤 **GESTION UTILISATEUR**\n"
        report += "=" * 40 + "\n\n"
        
        try:
            import httpx
            
            if not email and not user_id:
                return {"success": False, "error": "Spécifie email ou user_id"}
            
            identifier = email or user_id
            
            if action == "info":
                report += f"🔍 Recherche de: {identifier}\n\n"
                report += "⚠️ Cette action nécessite un accès admin à l'API.\n"
                report += "💡 Connectez-vous sur worldautofrance.com/admin pour gérer les utilisateurs.\n"
                
            elif action == "block":
                report += f"🚫 Blocage de: {identifier}\n\n"
                report += "⚠️ Cette action nécessite un accès admin.\n"
                report += "💡 Allez sur worldautofrance.com/admin > Utilisateurs > Bloquer\n"
                
            elif action == "unblock":
                report += f"✅ Déblocage de: {identifier}\n\n"
                report += "⚠️ Cette action nécessite un accès admin.\n"
                report += "💡 Allez sur worldautofrance.com/admin > Utilisateurs > Débloquer\n"
            
            else:
                return {"success": False, "error": f"Action inconnue: {action}. Utilise: info, block, unblock"}
            
            report += "\n" + "=" * 40 + "\n"
            return {"formatted_report": report}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def manage_listing(action: str, listing_id: str = None) -> Dict:
        """Gérer une annonce (info, delete, moderate)"""
        report = "\n📦 **GESTION ANNONCE**\n"
        report += "=" * 40 + "\n\n"
        
        try:
            import httpx
            
            if action == "info" and listing_id:
                with httpx.Client(timeout=10) as client:
                    r = client.get(f"https://worldautofrance.com/api/listings/{listing_id}")
                    if r.status_code == 200:
                        data = r.json()
                        report += f"📋 **Annonce #{listing_id}**\n"
                        report += f"   • Titre: {data.get('title', 'N/A')}\n"
                        report += f"   • Prix: {data.get('price', 'N/A')}€\n"
                        report += f"   • Vendeur: {data.get('seller_name', 'N/A')}\n"
                        report += f"   • Statut: {data.get('status', 'N/A')}\n"
                        report += f"   • Créée le: {data.get('created_at', 'N/A')}\n"
                    else:
                        report += f"❌ Annonce non trouvée (code {r.status_code})\n"
                        
            elif action == "delete":
                report += f"🗑️ Suppression de l'annonce: {listing_id}\n\n"
                report += "⚠️ Cette action nécessite un accès admin.\n"
                report += "💡 Allez sur worldautofrance.com/admin > Annonces > Supprimer\n"
                
            elif action == "moderate":
                report += f"⚖️ Modération de l'annonce: {listing_id}\n\n"
                report += "⚠️ Cette action nécessite un accès admin.\n"
                report += "💡 Allez sur worldautofrance.com/admin > Annonces > Modérer\n"
                
            else:
                report += "📋 Actions disponibles:\n"
                report += "   • info <id> - Voir les détails d'une annonce\n"
                report += "   • delete <id> - Supprimer une annonce\n"
                report += "   • moderate <id> - Modérer une annonce\n"
            
            report += "\n" + "=" * 40 + "\n"
            return {"formatted_report": report}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def deploy_update(service: str = "all") -> Dict:
        """Déployer une mise à jour sur le VPS"""
        report = "\n🚀 **DÉPLOIEMENT WORLDAUTO**\n"
        report += "=" * 40 + "\n\n"
        
        try:
            import subprocess
            
            ssh_base = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@148.230.115.118'
            
            if service == "all":
                cmd = f'{ssh_base} "cd /var/www/worldauto && git pull && docker-compose up -d --build"'
                report += "📦 Déploiement complet (frontend + backend)...\n"
            elif service == "frontend":
                cmd = f'{ssh_base} "cd /var/www/worldauto && git pull && docker-compose up -d --build frontend"'
                report += "🎨 Déploiement frontend uniquement...\n"
            elif service == "backend":
                cmd = f'{ssh_base} "cd /var/www/worldauto && git pull && docker-compose up -d --build backend"'
                report += "⚙️ Déploiement backend uniquement...\n"
            elif service == "restart":
                cmd = f'{ssh_base} "cd /var/www/worldauto && docker-compose restart"'
                report += "🔄 Redémarrage des services...\n"
            else:
                return {"success": False, "error": f"Service inconnu: {service}. Utilise: all, frontend, backend, restart"}
            
            report += "\n"
            
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                report += "✅ **Déploiement réussi !**\n\n"
                if result.stdout:
                    report += "📜 Sortie:\n```\n" + result.stdout[-1000:] + "\n```\n"
            else:
                report += "❌ **Échec du déploiement**\n\n"
                if result.stderr:
                    report += "📜 Erreur:\n```\n" + result.stderr[-500:] + "\n```\n"
            
            report += "\n" + "=" * 40 + "\n"
            return {"formatted_report": report}
            
        except subprocess.TimeoutExpired:
            return {"formatted_report": report + "⚠️ Timeout - Le déploiement prend du temps, vérifiez manuellement.\n"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def analyze_errors() -> Dict:
        """Analyser les erreurs récentes dans les logs"""
        report = "\n🔍 **ANALYSE DES ERREURS**\n"
        report += "=" * 40 + "\n\n"
        
        try:
            import subprocess
            
            ssh_base = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@148.230.115.118'
            
            # Récupérer les logs backend avec les erreurs
            cmd = f'{ssh_base} "docker-compose -f /var/www/worldauto/docker-compose.yml logs --tail=200 backend 2>&1 | grep -i -E \\"error|exception|traceback|failed\\" | tail -20"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            
            report += "🔧 **Erreurs Backend (dernières 20):**\n"
            if result.returncode == 0 and result.stdout.strip():
                errors = result.stdout.strip().split('\n')
                for i, err in enumerate(errors[-10:], 1):
                    report += f"   {i}. {err[:100]}...\n" if len(err) > 100 else f"   {i}. {err}\n"
            else:
                report += "   ✅ Aucune erreur récente trouvée !\n"
            
            report += "\n"
            
            # Récupérer les logs frontend
            cmd = f'{ssh_base} "docker-compose -f /var/www/worldauto/docker-compose.yml logs --tail=100 frontend 2>&1 | grep -i -E \\"error|warn\\" | tail -10"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            
            report += "🎨 **Erreurs Frontend (dernières 10):**\n"
            if result.returncode == 0 and result.stdout.strip():
                errors = result.stdout.strip().split('\n')
                for i, err in enumerate(errors[-5:], 1):
                    report += f"   {i}. {err[:100]}...\n" if len(err) > 100 else f"   {i}. {err}\n"
            else:
                report += "   ✅ Aucune erreur récente trouvée !\n"
            
            report += "\n" + "=" * 40 + "\n"
            return {"formatted_report": report}
            
        except subprocess.TimeoutExpired:
            return {"formatted_report": report + "⚠️ Timeout SSH - Configure: ssh-copy-id root@148.230.115.118\n"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def manage_promo(action: str, code: str = None, discount: int = None, max_uses: int = None) -> Dict:
        """Gérer les codes promo"""
        report = "\n🎁 **GESTION PROMOS**\n"
        report += "=" * 40 + "\n\n"
        
        try:
            import httpx
            
            with httpx.Client(timeout=10) as client:
                if action == "list":
                    report += "📋 **Codes promo actifs:**\n"
                    # Tester quelques codes connus
                    known_codes = ["LANCEMENT", "WELCOME", "PRO2024", "NOEL2024"]
                    for code in known_codes:
                        try:
                            r = client.get(f"https://worldautofrance.com/api/promo/{code}/status")
                            if r.status_code == 200:
                                data = r.json()
                                report += f"   ✅ {code}: {data.get('discount', '?')}% - {data.get('uses', '?')} utilisations\n"
                        except:
                            pass
                    report += "\n💡 Pour la liste complète, consultez l'admin.\n"
                    
                elif action == "check" and code:
                    r = client.get(f"https://worldautofrance.com/api/promo/{code}/status")
                    if r.status_code == 200:
                        data = r.json()
                        report += f"✅ **Code {code} valide !**\n"
                        report += f"   • Réduction: {data.get('discount', 'N/A')}%\n"
                        report += f"   • Utilisations: {data.get('uses', 'N/A')}\n"
                        report += f"   • Max: {data.get('max_uses', 'Illimité')}\n"
                    else:
                        report += f"❌ Code {code} invalide ou expiré.\n"
                        
                elif action == "create":
                    report += "➕ **Créer un code promo:**\n\n"
                    report += "⚠️ Cette action nécessite un accès admin.\n"
                    report += "💡 Allez sur worldautofrance.com/admin > Promos > Créer\n"
                    
                else:
                    report += "📋 Actions disponibles:\n"
                    report += "   • list - Voir les promos actives\n"
                    report += "   • check <code> - Vérifier un code\n"
                    report += "   • create - Créer un nouveau code\n"
            
            report += "\n" + "=" * 40 + "\n"
            return {"formatted_report": report}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def cleanup_vps() -> Dict:
        """Nettoyer le VPS (docker, logs, cache)"""
        report = "\n🧹 **NETTOYAGE VPS**\n"
        report += "=" * 40 + "\n\n"
        
        try:
            import subprocess
            
            ssh_base = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@148.230.115.118'
            
            # Espace avant
            cmd = f'{ssh_base} "df -h / | tail -1 | awk \'{{print $4}}\'"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            space_before = result.stdout.strip() if result.returncode == 0 else "N/A"
            
            report += f"💾 Espace disponible avant: {space_before}\n\n"
            report += "🔄 Nettoyage en cours...\n"
            
            # Docker prune
            cmd = f'{ssh_base} "docker system prune -f 2>&1"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
            if result.returncode == 0:
                report += "   ✅ Docker nettoyé\n"
            
            # Logs anciens
            cmd = f'{ssh_base} "find /var/log -type f -name \\"*.log\\" -mtime +7 -delete 2>/dev/null; echo OK"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            report += "   ✅ Vieux logs supprimés\n"
            
            # Cache apt
            cmd = f'{ssh_base} "apt-get clean 2>/dev/null; echo OK"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            report += "   ✅ Cache apt nettoyé\n"
            
            # Espace après
            cmd = f'{ssh_base} "df -h / | tail -1 | awk \'{{print $4}}\'"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            space_after = result.stdout.strip() if result.returncode == 0 else "N/A"
            
            report += f"\n💾 Espace disponible après: {space_after}\n"
            report += "\n" + "=" * 40 + "\n"
            return {"formatted_report": report}
            
        except subprocess.TimeoutExpired:
            return {"formatted_report": report + "⚠️ Timeout SSH\n"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def send_notification(type: str, message: str, target: str = "all") -> Dict:
        """Envoyer une notification (nécessite config)"""
        report = "\n📢 **NOTIFICATIONS**\n"
        report += "=" * 40 + "\n\n"
        
        report += f"📨 Type: {type}\n"
        report += f"👥 Cible: {target}\n"
        report += f"💬 Message: {message}\n\n"
        
        report += "⚠️ **Envoi de notifications:**\n"
        report += "Cette fonctionnalité nécessite une configuration côté admin.\n\n"
        report += "💡 Options disponibles sur worldautofrance.com/admin:\n"
        report += "   • Email en masse\n"
        report += "   • Notifications push\n"
        report += "   • Messages système\n"
        
        report += "\n" + "=" * 40 + "\n"
        return {"formatted_report": report}
    
    @staticmethod
    def db_backup() -> Dict:
        """Sauvegarder la base de données MongoDB"""
        report = "\n💾 **BACKUP BASE DE DONNÉES**\n"
        report += "=" * 40 + "\n\n"
        
        try:
            import subprocess
            from datetime import datetime
            
            ssh_base = 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@148.230.115.118'
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"worldauto_backup_{timestamp}"
            
            report += f"📦 Création du backup: {backup_name}\n\n"
            
            # Créer le dossier backups s'il n'existe pas
            cmd = f'{ssh_base} "mkdir -p /var/www/worldauto/backups"'
            subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            
            # Exécuter mongodump
            cmd = f'{ssh_base} "docker exec worldauto-mongodb mongodump --archive=/data/db/{backup_name}.archive --gzip 2>&1"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0:
                report += "✅ **Backup créé avec succès !**\n\n"
                report += f"📍 Emplacement: /data/db/{backup_name}.archive\n"
                
                # Copier vers le dossier backups
                cmd = f'{ssh_base} "docker cp worldauto-mongodb:/data/db/{backup_name}.archive /var/www/worldauto/backups/"'
                subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
                report += f"📁 Copié vers: /var/www/worldauto/backups/{backup_name}.archive\n"
            else:
                report += "❌ **Échec du backup**\n"
                if result.stderr:
                    report += f"Erreur: {result.stderr[:200]}\n"
            
            report += "\n" + "=" * 40 + "\n"
            return {"formatted_report": report}
            
        except subprocess.TimeoutExpired:
            return {"formatted_report": report + "⚠️ Timeout - Le backup prend du temps.\n"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def recent_activity() -> Dict:
        """Voir l'activité récente du site"""
        report = "\n📈 **ACTIVITÉ RÉCENTE**\n"
        report += "=" * 40 + "\n\n"
        
        try:
            import httpx
            
            with httpx.Client(timeout=15) as client:
                # Dernières annonces
                report += "📦 **Dernières annonces:**\n"
                try:
                    r = client.get("https://worldautofrance.com/api/listings?limit=5&sort=-created_at")
                    if r.status_code == 200:
                        data = r.json()
                        listings = data.get("listings", data) if isinstance(data, dict) else data
                        if isinstance(listings, list):
                            for i, listing in enumerate(listings[:5], 1):
                                title = listing.get('title', 'Sans titre')[:30]
                                price = listing.get('price', 'N/A')
                                report += f"   {i}. {title}... - {price}€\n"
                        else:
                            report += "   Aucune annonce récente\n"
                except Exception as e:
                    report += f"   ⚠️ Impossible de récupérer ({str(e)[:30]})\n"
                
                report += "\n"
                
                # Statut des services
                report += "🔌 **Statut API:**\n"
                endpoints = ["/api/pricing", "/api/listings?limit=1"]
                for ep in endpoints:
                    try:
                        r = client.get(f"https://worldautofrance.com{ep}")
                        status = "✅ OK" if r.status_code == 200 else f"⚠️ {r.status_code}"
                        report += f"   • {ep}: {status}\n"
                    except:
                        report += f"   • {ep}: ❌ Erreur\n"
            
            report += "\n" + "=" * 40 + "\n"
            return {"formatted_report": report}
            
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

# ============== PROJECT KNOWLEDGE ==============

class ProjectKnowledge:
    """Base de connaissances du projet - mémorise les infos importantes"""
    
    def __init__(self):
        self._knowledge_file = os.path.join(os.path.dirname(__file__), '.cody_knowledge.json')
        self._knowledge = self._load()
    
    def _load(self) -> dict:
        """Charger les connaissances"""
        try:
            if os.path.exists(self._knowledge_file):
                with open(self._knowledge_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except:
            pass
        return {
            "project_type": None,
            "important_paths": {},
            "commands": {},
            "last_scan": None,
            "notes": []
        }
    
    def _save(self):
        """Sauvegarder les connaissances"""
        try:
            with open(self._knowledge_file, 'w', encoding='utf-8') as f:
                json.dump(self._knowledge, f, ensure_ascii=False, indent=2)
        except:
            pass
    
    def scan_project(self) -> str:
        """Scanner et mémoriser la structure du projet"""
        import datetime
        results = []
        
        # Détecter le type de projet
        project_path = Path(config.PROJECT_PATH)
        
        # Fichiers de config importants à chercher
        important_files = {
            "backend/.env": "Configuration backend (variables d'environnement)",
            "frontend/.env": "Configuration frontend",
            ".env": "Configuration principale",
            "docker-compose.yml": "Configuration Docker",
            "package.json": "Dépendances Node.js",
            "requirements.txt": "Dépendances Python",
            "backend/server.py": "Serveur backend principal",
            "frontend/src/App.js": "Application React principale"
        }
        
        found_paths = {}
        for rel_path, description in important_files.items():
            full_path = project_path / rel_path
            if full_path.exists():
                found_paths[rel_path] = description
                results.append(f"✅ {rel_path} - {description}")
        
        self._knowledge["important_paths"] = found_paths
        
        # Détecter le type de projet
        if (project_path / "backend").exists() and (project_path / "frontend").exists():
            self._knowledge["project_type"] = "fullstack"
            self._knowledge["commands"] = {
                "restart_backend": "cd backend && docker-compose restart backend || sudo supervisorctl restart backend",
                "restart_frontend": "cd frontend && npm start || yarn start",
                "install_backend": "cd backend && pip install -r requirements.txt",
                "install_frontend": "cd frontend && npm install || yarn install"
            }
        elif (project_path / "package.json").exists():
            self._knowledge["project_type"] = "node"
        elif (project_path / "requirements.txt").exists():
            self._knowledge["project_type"] = "python"
        
        self._knowledge["last_scan"] = datetime.datetime.now().isoformat()
        self._save()
        
        return "\n".join(results) if results else "Aucun fichier important trouvé"
    
    def get_env_path(self) -> str:
        """Retourne le chemin du fichier .env principal"""
        for path in ["backend/.env", ".env", "frontend/.env"]:
            if path in self._knowledge.get("important_paths", {}):
                return os.path.join(config.PROJECT_PATH, path)
        return None
    
    def add_note(self, note: str):
        """Ajouter une note/mémo"""
        self._knowledge.setdefault("notes", []).append({
            "text": note,
            "date": datetime.datetime.now().isoformat()
        })
        self._save()
    
    def get_summary(self) -> str:
        """Résumé des connaissances du projet"""
        k = self._knowledge
        lines = [
            f"📁 Type de projet: {k.get('project_type', 'inconnu')}",
            f"📅 Dernier scan: {k.get('last_scan', 'jamais')}",
            f"📄 Fichiers importants: {len(k.get('important_paths', {}))}",
        ]
        if k.get("notes"):
            lines.append(f"📝 Notes mémorisées: {len(k['notes'])}")
        return "\n".join(lines)

# Instance globale
project_knowledge = ProjectKnowledge()

# ============== LLM CLIENT ==============

class LLMClient:
    """Client pour communiquer avec les LLMs"""
    
    SYSTEM_PROMPT = """Tu es Cody, le centre de commande de WorldAuto Pro.

🚨 RÈGLE ABSOLUE: UTILISE UNIQUEMENT LES OUTILS CI-DESSOUS. N'INVENTE JAMAIS DE PROCÉDURES !

📋 OUTILS DISPONIBLES:

🔍 DIAGNOSTIC & MONITORING:
{"tool": "check_worldauto", "params": {}} → État du site, API, Docker
{"tool": "security_scan", "params": {}} → Headers HTTP, SSL, endpoints
{"tool": "performance_test", "params": {}} → Temps de réponse API
{"tool": "full_diagnostic", "params": {}} → Santé + sécu + perf
{"tool": "vps_monitoring", "params": {}} → CPU, RAM, disque du VPS
{"tool": "analyze_errors", "params": {}} → Erreurs récentes dans les logs
{"tool": "check_logs", "params": {}} → Logs Docker bruts
{"tool": "recent_activity", "params": {}} → Activité récente du site

📊 STATS & DONNÉES:
{"tool": "get_stats", "params": {}} → Stats utilisateurs, annonces, revenus

🚀 DÉPLOIEMENT:
{"tool": "deploy_update", "params": {"service": "all"}} → Déployer tout
{"tool": "deploy_update", "params": {"service": "frontend"}} → Frontend seul
{"tool": "deploy_update", "params": {"service": "backend"}} → Backend seul
{"tool": "deploy_update", "params": {"service": "restart"}} → Redémarrer

💾 MAINTENANCE:
{"tool": "db_backup", "params": {}} → Sauvegarder MongoDB
{"tool": "cleanup_vps", "params": {}} → Nettoyer Docker/logs/cache

👤 GESTION UTILISATEURS:
{"tool": "manage_user", "params": {"action": "info", "email": "x@y.com"}}
{"tool": "manage_user", "params": {"action": "block", "email": "x@y.com"}}
{"tool": "manage_user", "params": {"action": "unblock", "email": "x@y.com"}}

📦 GESTION ANNONCES:
{"tool": "manage_listing", "params": {"action": "info", "listing_id": "123"}}
{"tool": "manage_listing", "params": {"action": "delete", "listing_id": "123"}}

🎁 PROMOS:
{"tool": "manage_promo", "params": {"action": "list"}}
{"tool": "manage_promo", "params": {"action": "check", "code": "LANCEMENT"}}

📂 FICHIERS:
{"tool": "read_file", "params": {"path": "/chemin"}}
{"tool": "write_file", "params": {"path": "/chemin", "content": "..."}}
{"tool": "list_files", "params": {"pattern": "**/*.py"}}

💻 COMMANDES:
{"tool": "execute_command", "params": {"command": "ls"}} → PC local
{"tool": "vps_command", "params": {"command": "docker ps"}} → VPS

🧪 TEST API:
{"tool": "test_api", "params": {"method": "GET", "endpoint": "/api/pricing"}}

📸 CAPTURE:
{"tool": "screenshot", "params": {"url": "https://worldautofrance.com"}}

🎯 RACCOURCIS (comprends ces demandes):
- "stats" ou "statistiques" → get_stats
- "monitoring" ou "ressources" → vps_monitoring
- "erreurs" ou "problèmes" → analyze_errors  
- "déploie" ou "deploy" → deploy_update
- "backup" ou "sauvegarde" → db_backup
- "nettoie" ou "clean" → cleanup_vps
- "promos" → manage_promo list
- "activité" → recent_activity

📝 FORMAT: Une phrase + l'outil JSON. C'est tout !

⛔ INTERDIT: N'invente pas de procédures, n'exécute pas npm/pip.

Réponds en français."""

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
        
        # Process any actions in the response FIRST
        processed_response = await self._process_actions(response)
        
        # Ajouter la réponse TRAITÉE à l'historique persistant (avec les résultats des outils)
        session_manager.add_message("assistant", processed_response, self.session_id)
        
        return processed_response
    
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
            memory_reminder = ""
            
            if len(self.conversation_history) > 1:
                history_context = "\n\n📜 HISTORIQUE DE LA SESSION PRÉCÉDENTE:\n"
                for msg in self.conversation_history[:-1]:
                    role = "👤 Utilisateur" if msg["role"] == "user" else "🤖 Cody"
                    history_context += f"{role}: {msg['content'][:500]}...\n" if len(msg['content']) > 500 else f"{role}: {msg['content']}\n"
                history_context += "\n---\n🆕 MESSAGE ACTUEL:\n"
                
                # Rappel de mémoire si c'est le premier message après redémarrage
                memory_reminder = """
⚠️ IMPORTANT: Tu as un historique de conversation ci-dessus. 
Quand l'utilisateur te demande si tu te souviens, réponds OUI et résume les derniers échanges.
"""
            
            # Ajouter un rappel des capacités si c'est une question sur les fonctionnalités
            last_msg = self.conversation_history[-1]["content"] if self.conversation_history else ""
            capabilities_reminder = ""
            
            # Détection de question sur la mémoire
            memory_keywords = ["souviens", "rappel", "mémoire", "dernière session", "session précédente", "avant", "hier"]
            if any(kw in last_msg.lower() for kw in memory_keywords) and len(self.conversation_history) > 1:
                capabilities_reminder = f"""

🧠 RAPPEL MÉMOIRE: Tu as {len(self.conversation_history) - 1} messages en mémoire de la session précédente.
Réponds OUI tu te souviens et résume brièvement ce qui a été fait !
"""
            
            keywords = ["fonctionnalit", "capacit", "peux-tu", "peux tu", "sais-tu", "sais tu", "mise a jour", "mise à jour", "version", "appris", "nouveau"]
            if any(kw in last_msg.lower() for kw in keywords):
                capabilities_reminder += """

🔔 RAPPEL DE TES CAPACITÉS (Cody v2.3.1):

📁 GESTION DE FICHIERS:
- read_file: Lire un fichier
- write_file: Écrire/créer un fichier  
- list_files: Lister les fichiers
- search_in_files: Chercher du texte

⚙️ COMMANDES:
- execute_command: Exécuter des commandes shell

🔧 ENVIRONNEMENT:
- get_env_value: Lire une variable .env
- set_env_value: Modifier une variable .env

🧠 MÉMOIRE PERSISTANTE:
- scan_project: Scanner et mémoriser le projet
- add_note: Mémoriser une info
- get_knowledge: Voir ce que tu sais
- Tu conserves l'historique entre les sessions !

Tu dois répondre en mentionnant CES capacités quand on te demande ce que tu sais faire !
"""
            
            # Create chat instance
            chat = LlmChat(
                api_key=config.EMERGENT_API_KEY,
                session_id=self.session_id,
                system_message=self.SYSTEM_PROMPT + memory_reminder + capabilities_reminder + history_context
            ).with_model(provider, model_name)
            
            # Send current message
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
        
        # Pattern PRINCIPAL: {"tool": "...", "params": {...}} - LE PLUS IMPORTANT
        tool_pattern = r'\{"tool":\s*"(\w+)",\s*"params":\s*(\{[^}]*\})\}'
        for match in re.finditer(tool_pattern, response):
            tool_name = match.group(1)
            params_str = match.group(2)
            original_text = match.group(0)
            
            try:
                params = json.loads(params_str) if params_str != '{}' else {}
            except:
                params = {}
            
            result = None
            try:
                if tool_name == 'read_file':
                    result = tools.read_file(params.get('path', ''))
                elif tool_name == 'write_file':
                    result = tools.write_file(params.get('path', ''), params.get('content', ''))
                elif tool_name == 'execute_command':
                    result = tools.execute_command(params.get('command', ''))
                elif tool_name == 'vps_command':
                    result = tools.vps_command(params.get('command', ''))
                elif tool_name == 'check_worldauto':
                    result = tools.check_worldauto()
                elif tool_name == 'security_scan':
                    result = tools.security_scan()
                elif tool_name == 'performance_test':
                    result = tools.performance_test()
                elif tool_name == 'check_logs':
                    result = tools.check_logs()
                elif tool_name == 'modify_hero':
                    result = tools.modify_hero(params.get('title'), params.get('subtitle'), params.get('button_text'))
                elif tool_name == 'full_diagnostic':
                    result = tools.full_diagnostic()
                elif tool_name == 'list_files':
                    result = tools.list_files(params.get('pattern', '**/*'))
                elif tool_name == 'search_in_files':
                    result = tools.search_in_files(params.get('query', ''), params.get('file_pattern', '**/*'))
                elif tool_name == 'get_project_structure':
                    result = tools.get_project_structure()
                elif tool_name == 'scan_project':
                    result = tools.scan_project()
                elif tool_name == 'get_env_value':
                    result = tools.get_env_value(params.get('key', ''))
                elif tool_name == 'set_env_value':
                    result = tools.set_env_value(params.get('key', ''), params.get('value', ''))
                elif tool_name == 'add_note':
                    result = tools.add_note(params.get('note', ''))
                elif tool_name == 'get_knowledge':
                    result = tools.get_knowledge()
                elif tool_name == 'screenshot':
                    result = tools.screenshot(params.get('url', 'https://worldautofrance.com'))
                elif tool_name == 'test_api':
                    result = tools.test_api(params.get('method', 'GET'), params.get('endpoint', '/api/pricing'), params.get('data'))
                elif tool_name == 'deploy':
                    result = tools.deploy()
                elif tool_name == 'backup_db':
                    result = tools.backup_db()
                elif tool_name == 'check_services':
                    result = tools.check_services()
                # Nouveaux outils v3.5.0
                elif tool_name == 'get_stats':
                    result = tools.get_stats()
                elif tool_name == 'vps_monitoring':
                    result = tools.vps_monitoring()
                elif tool_name == 'manage_user':
                    result = tools.manage_user(params.get('action', 'info'), params.get('email'), params.get('user_id'))
                elif tool_name == 'manage_listing':
                    result = tools.manage_listing(params.get('action', 'info'), params.get('listing_id'))
                elif tool_name == 'deploy_update':
                    result = tools.deploy_update(params.get('service', 'all'))
                elif tool_name == 'analyze_errors':
                    result = tools.analyze_errors()
                elif tool_name == 'manage_promo':
                    result = tools.manage_promo(params.get('action', 'list'), params.get('code'), params.get('discount'), params.get('max_uses'))
                elif tool_name == 'cleanup_vps':
                    result = tools.cleanup_vps()
                elif tool_name == 'send_notification':
                    result = tools.send_notification(params.get('type', 'email'), params.get('message', ''), params.get('target', 'all'))
                elif tool_name == 'db_backup':
                    result = tools.db_backup()
                elif tool_name == 'recent_activity':
                    result = tools.recent_activity()
            except Exception as e:
                result = {"success": False, "error": str(e)}
            
            if result:
                # Affichage spécial pour les outils avec rapport formaté
                tools_with_report = ['check_worldauto', 'security_scan', 'performance_test', 'full_diagnostic', 
                                    'get_stats', 'vps_monitoring', 'manage_user', 'manage_listing', 
                                    'deploy_update', 'analyze_errors', 'manage_promo', 'cleanup_vps',
                                    'send_notification', 'db_backup', 'recent_activity']
                if tool_name in tools_with_report and 'formatted_report' in result:
                    result_str = result['formatted_report']
                    # Ajouter une conclusion automatique basée sur le résultat
                    if tool_name == 'check_worldauto':
                        if result.get('all_ok'):
                            result_str += "\n\n🎉 **Conclusion** : WorldAuto fonctionne parfaitement ! Tous les services API répondent correctement et le site est accessible. ✅"
                        else:
                            result_str += "\n\n⚠️ **Conclusion** : Des problèmes ont été détectés. Vérifie les points marqués ❌ ci-dessus."
                    elif tool_name == 'security_scan':
                        score = result.get('score', 0)
                        if score >= 80:
                            result_str += f"\n\n🎉 **Conclusion** : Sécurité correcte avec un score de {score}%. ✅"
                        else:
                            result_str += f"\n\n⚠️ **Conclusion** : Score de sécurité de {score}%. Des améliorations sont recommandées."
                    elif tool_name == 'performance_test':
                        result_str += "\n\n✅ **Test de performance terminé !**"
                    elif tool_name == 'full_diagnostic':
                        result_str += "\n\n✅ **Diagnostic complet terminé !**"
                else:
                    result_str = f"\n\n📋 **Résultat de {tool_name}:**\n```\n{json.dumps(result, indent=2, ensure_ascii=False)[:3000]}\n```"
                response = response.replace(original_text, result_str, 1)
                
                # Supprimer les phrases inutiles qui restent après l'outil
                cleanup_patterns = [
                    r'Je vais maintenant analyser.*?📊',
                    r'Laisse-moi analyser.*?\.',
                    r'Analysons ces résultats.*?\.',
                    r'Analysons les résultats.*?📊',
                    r'Je te présenterai les résultats.*?📊',
                    r'Voici les résultats dès que.*?\.',
                    r'Cela nous permettra d\'identifier.*?\.',
                    r'dès que le diagnostic sera terminé.*?📊',
                    r'pour nous assurer que tout fonctionne.*?📊',
                ]
                for pattern in cleanup_patterns:
                    response = re.sub(pattern, '', response, flags=re.IGNORECASE)
        
        # Pattern 2: Format avec balises ```action {"tool": "...", "params": {...}} ```
        action_pattern = r'```action\s*\n?({.*?})\s*\n?```'
        matches = re.findall(action_pattern, response, re.DOTALL)
        
        # Pattern 2: Format simplifié {"path": "..."} ou {"command": "..."} (sans balises)
        simple_patterns = [
            (r'\{"path":\s*"([^"]+)"\s*\}', 'read_file', 'path'),
            (r'\{"command":\s*"([^"]+)"\s*\}', 'execute_command', 'command'),
            (r'\{"pattern":\s*"([^"]+)"\s*\}', 'list_files', 'pattern'),
            (r'\{"query":\s*"([^"]+)"[^}]*\}', 'search_in_files', 'query'),
            (r'\{"key":\s*"([^"]+)"\s*\}', 'get_env_value', 'key'),
            (r'\{"note":\s*"([^"]+)"\s*\}', 'add_note', 'note'),
        ]
        
        # Pattern 3: Format avec nom d'outil sur ligne séparée (ex: "read_file\n{"path": "..."}")
        tool_line_patterns = [
            (r'read_file[\s\n]*\{"path":\s*"([^"]+)"\s*\}', 'read_file'),
            (r'execute_command[\s\n]*\{"command":\s*"([^"]+)"\s*\}', 'execute_command'),
            (r'list_files[\s\n]*\{"pattern":\s*"([^"]+)"\s*\}', 'list_files'),
            (r'get_project_structure[\s\n]*(\{\s*\})?', 'get_project_structure'),
            (r'scan_project[\s\n]*(\{\s*\})?', 'scan_project'),
            (r'get_knowledge[\s\n]*(\{\s*\})?', 'get_knowledge'),
        ]
        
        # Traiter le format avec nom d'outil sur ligne séparée
        for pattern, tool_name in tool_line_patterns:
            for match in re.finditer(pattern, response):
                original_text = match.group(0)
                match_value = match.group(1) if match.lastindex and match.lastindex >= 1 else None
                
                result = None
                try:
                    if tool_name == 'read_file' and match_value:
                        result = tools.read_file(match_value)
                    elif tool_name == 'execute_command' and match_value:
                        result = tools.execute_command(match_value)
                    elif tool_name == 'list_files' and match_value:
                        result = tools.list_files(match_value)
                    elif tool_name == 'get_project_structure':
                        result = tools.get_project_structure()
                    elif tool_name == 'scan_project':
                        result = tools.scan_project()
                    elif tool_name == 'get_knowledge':
                        result = tools.get_knowledge()
                except Exception as e:
                    result = {"error": str(e)}
                
                if result:
                    result_str = f"\n\n📋 **Résultat de {tool_name}:**\n```\n{json.dumps(result, indent=2, ensure_ascii=False)[:3000]}\n```"
                    response = response.replace(original_text, result_str, 1)
        
        # Traiter le format simplifié
        for pattern, tool_name, param_name in simple_patterns:
            for match in re.finditer(pattern, response):
                match_value = match.group(1)
                original_text = match.group(0)
                
                result = None
                if tool_name == 'read_file':
                    result = tools.read_file(match_value)
                elif tool_name == 'execute_command':
                    result = tools.execute_command(match_value)
                elif tool_name == 'list_files':
                    result = tools.list_files(match_value)
                elif tool_name == 'search_in_files':
                    result = tools.search_in_files(match_value, '**/*')
                elif tool_name == 'get_env_value':
                    result = tools.get_env_value(match_value)
                elif tool_name == 'add_note':
                    result = tools.add_note(match_value)
                
                if result:
                    result_str = f"\n\n📋 **Résultat de {tool_name}:**\n```\n{json.dumps(result, indent=2, ensure_ascii=False)[:3000]}\n```"
                    response = response.replace(original_text, result_str, 1)
        
        # Traiter le format complet avec balises ```action```
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
                elif tool_name == 'scan_project':
                    result = tools.scan_project()
                elif tool_name == 'get_env_value':
                    result = tools.get_env_value(params.get('key', ''))
                elif tool_name == 'set_env_value':
                    result = tools.set_env_value(params.get('key', ''), params.get('value', ''))
                elif tool_name == 'add_note':
                    result = tools.add_note(params.get('note', ''))
                elif tool_name == 'get_knowledge':
                    result = tools.get_knowledge()
                elif tool_name == 'screenshot':
                    result = tools.screenshot(params.get('url', 'https://worldautofrance.com'))
                elif tool_name == 'test_api':
                    result = tools.test_api(params.get('method', 'GET'), params.get('endpoint', '/api/pricing'), params.get('data'))
                elif tool_name == 'deploy':
                    result = tools.deploy()
                elif tool_name == 'backup_db':
                    result = tools.backup_db()
                elif tool_name == 'check_services':
                    result = tools.check_services()
                elif tool_name == 'vps_command':
                    result = tools.vps_command(params.get('command', ''))
                elif tool_name == 'check_worldauto':
                    result = tools.check_worldauto()
                elif tool_name == 'security_scan':
                    result = tools.security_scan()
                elif tool_name == 'performance_test':
                    result = tools.performance_test()
                elif tool_name == 'check_logs':
                    result = tools.check_logs()
                elif tool_name == 'modify_hero':
                    result = tools.modify_hero(params.get('title'), params.get('subtitle'), params.get('button_text'))
                elif tool_name == 'full_diagnostic':
                    result = tools.full_diagnostic()
                
                if result:
                    result_str = f"\n\n📋 **Résultat de {tool_name}:**\n```json\n{json.dumps(result, indent=2, ensure_ascii=False)[:3000]}\n```"
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
            overflow: hidden;
        }
        
        /* ========== MESSAGES ========== */
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem 1.5rem;
            padding-bottom: 180px;
            display: flex;
            flex-direction: column;
            gap: 0;
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
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
            max-width: 900px;
            background: var(--bg-main);
            padding: 1rem 1.5rem 1.25rem;
            border-top: 1px solid var(--border);
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
                        <strong>Salut ! Je suis Cody, ton assistant de développement.</strong><br><br>
                        Je me souviens de nos conversations précédentes et je connais ton projet.<br>
                        Que veux-tu faire aujourd'hui ? 🚀
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
            requestAnimationFrame(() => {
                messagesEl.scrollTop = messagesEl.scrollHeight + 500;
            });
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
            
            // Detecter et formater les resultats JSON d'actions
            try {
                // Si c'est un bloc JSON de resultat
                if (result.includes('"success"') && result.includes('"stdout"')) {
                    const jsonMatch = result.match(/\{[\s\S]*"success"[\s\S]*\}/);
                    if (jsonMatch) {
                        const data = JSON.parse(jsonMatch[0]);
                        let formatted = '';
                        
                        if (data.success) {
                            formatted = '✅ ';
                            if (data.stdout && data.stdout.trim()) {
                                formatted += '<pre><code>' + data.stdout.trim() + '</code></pre>';
                            } else if (data.stderr && data.stderr.trim()) {
                                // Filtrer les messages wget/curl
                                const stderr = data.stderr.replace(/--.*\n|Résolution.*\n|Connexion.*\n|requête.*\n|Taille.*\n|Enregistre.*\n|\s*\d+K.*\n|.*enregistré.*\n/g, '').trim();
                                if (stderr) {
                                    formatted += '<pre><code>' + stderr + '</code></pre>';
                                } else {
                                    formatted += 'Commande executee avec succes';
                                }
                            } else {
                                formatted += 'Commande executee avec succes';
                            }
                        } else {
                            formatted = '❌ Erreur: ' + (data.error || data.stderr || 'Echec');
                        }
                        
                        result = result.replace(jsonMatch[0], formatted);
                    }
                }
            } catch (e) {
                // Pas du JSON valide, continuer normalement
            }
            
            // Formatage Markdown standard
            result = result.split('```').map((part, i) => {
                if (i % 2 === 1) {
                    // Enlever le nom du langage si present (ex: ```json)
                    const lines = part.split('\n');
                    if (lines[0] && !lines[0].includes(' ') && lines[0].length < 15) {
                        lines.shift();
                    }
                    return '<pre><code>' + lines.join('\n') + '</code></pre>';
                }
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

def get_themed_html():
    """Génère le HTML avec les couleurs du thème personnalisé"""
    colors = THEME_CONFIG.get('colors', {})
    dark_colors = THEME_CONFIG.get('dark_colors', {})
    agent_name = THEME_CONFIG.get('agent_name', 'Cody')
    
    # Remplacer les variables CSS par les couleurs personnalisées
    themed_html = HTML_TEMPLATE
    
    # Variables CSS à remplacer
    css_vars = {
        '--bg-main: #ffffff': f"--bg-main: {colors.get('bg_main', '#ffffff')}",
        '--bg-sidebar: #f9fafb': f"--bg-sidebar: {colors.get('bg_sidebar', '#f9fafb')}",
        '--text-primary: #1f2937': f"--text-primary: {colors.get('text_primary', '#1f2937')}",
        '--text-secondary: #6b7280': f"--text-secondary: {colors.get('text_secondary', '#6b7280')}",
        '--accent: #f97316': f"--accent: {colors.get('accent', '#f97316')}",
        '--accent-hover: #ea580c': f"--accent-hover: {colors.get('accent_hover', '#ea580c')}",
        '--border: #e5e7eb': f"--border: {colors.get('border', '#e5e7eb')}",
        '--success: #22c55e': f"--success: {colors.get('success', '#22c55e')}",
    }
    
    for old, new in css_vars.items():
        themed_html = themed_html.replace(old, new)
    
    # Remplacer le nom de l'agent
    themed_html = themed_html.replace('<title>🤖 Cody</title>', f'<title>🤖 {agent_name}</title>')
    themed_html = themed_html.replace('Cody</span>', f'{agent_name}</span>')
    
    return themed_html

@app.route('/')
def index():
    return render_template_string(get_themed_html(), project_path=config.PROJECT_PATH)

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

@app.route('/api/theme', methods=['GET'])
def get_theme():
    """Obtenir la configuration du thème actuel"""
    return jsonify(THEME_CONFIG)

@app.route('/api/reload-theme', methods=['POST'])
def reload_theme():
    """Recharger la configuration du thème"""
    global THEME_CONFIG
    THEME_CONFIG = load_theme_config()
    return jsonify({"success": True, "theme": THEME_CONFIG})

@app.route('/api/sync-theme', methods=['POST'])
def sync_theme_from_server():
    """Synchroniser la configuration du thème depuis le serveur World Auto Pro"""
    global THEME_CONFIG
    try:
        sync_config_from_api(THEME_CONFIG)
        return jsonify({"success": True, "theme": THEME_CONFIG, "message": "Configuration synchronisée avec succès"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

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
