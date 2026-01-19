# 📚 GUIDE DE GESTION DES VENTES & REVERSEMENTS
## World Auto France - Paiements CB via Stripe Direct

---

## 🎯 RÉSUMÉ DU SYSTÈME

Avec le système **Stripe Direct** :
- ✅ **Tous les acheteurs** peuvent payer par CB (pas besoin que le vendeur ait Stripe)
- 💰 **L'argent arrive sur VOTRE compte Stripe** (plateforme)
- 🏦 **Vous reversez ensuite aux vendeurs** par virement bancaire

---

## 💸 COMMISSION & CALCULS

| Élément | Valeur |
|---------|--------|
| **Commission plateforme** | 5% du prix |
| **Minimum** | 0,50 € |
| **Maximum** | 15 € |

### 📊 EXEMPLES DE CALCUL

#### Exemple 1 : Vente à 50€
| | Montant |
|---|---|
| Prix de vente | 50,00 € |
| Commission (5%) | 2,50 € |
| **À reverser au vendeur** | **47,50 €** |

#### Exemple 2 : Vente à 10€
| | Montant |
|---|---|
| Prix de vente | 10,00 € |
| Commission (min 0,50€) | 0,50 € |
| **À reverser au vendeur** | **9,50 €** |

#### Exemple 3 : Vente à 500€
| | Montant |
|---|---|
| Prix de vente | 500,00 € |
| Commission (max 15€) | 15,00 € |
| **À reverser au vendeur** | **485,00 €** |

#### Exemple 4 : Vente à 80€
| | Montant |
|---|---|
| Prix de vente | 80,00 € |
| Commission (5%) | 4,00 € |
| **À reverser au vendeur** | **76,00 €** |

---

## 📅 FRÉQUENCE DES REVERSEMENTS

### Recommandation par type de vendeur :

| Type | Fréquence | Délai après vente |
|------|-----------|-------------------|
| **Vendeurs PRO** | Hebdomadaire (chaque lundi) | 7 jours minimum |
| **Vendeurs Particuliers** | Bi-mensuel (1er et 15) | 7-14 jours |

### Pourquoi attendre 7 jours minimum ?
- ⏳ Permet de gérer les **litiges** et **remboursements**
- 🔒 Protège la plateforme contre la **fraude**
- 📦 Laisse le temps de **confirmer la livraison**

---

## 📝 PROCÉDURE DE REVERSEMENT

### Étape 1 : Accéder à la page Admin Ventes
```
https://worldautofrance.com/admin/ventes
```

### Étape 2 : Vérifier les ventes à reverser
1. Onglet **"Reversements par vendeur"**
2. Voir le montant total à reverser par vendeur
3. Vérifier que l'IBAN est renseigné

### Étape 3 : Effectuer le virement
1. Connectez-vous à votre **banque en ligne** ou **Stripe Dashboard**
2. Créez un virement vers l'IBAN du vendeur
3. Montant = **somme des "À reverser"** pour ce vendeur
4. Référence = "WORLDAUTO-[NOM VENDEUR]-[DATE]"

### Étape 4 : Marquer comme versé
1. Cliquez sur **"Marquer tout comme versé"** pour le vendeur
2. Le vendeur recevra une **notification automatique**

---

## 🔄 WORKFLOW QUOTIDIEN

### Tous les jours :
- [ ] Vérifier les nouvelles ventes payées
- [ ] Répondre aux litiges éventuels

### Chaque lundi (PRO) :
- [ ] Accéder à `/admin/ventes`
- [ ] Onglet "Reversements par vendeur"
- [ ] Filtrer : vendeurs PRO avec ventes > 7 jours
- [ ] Effectuer les virements
- [ ] Marquer comme versés

### Le 1er et 15 du mois (Particuliers) :
- [ ] Même procédure pour les particuliers

---

## 💰 REVENUS MENSUELS ESTIMÉS

| Volume de ventes/mois | Revenus commission |
|-----------------------|-------------------|
| 1 000 € | 50 € |
| 5 000 € | 250 € |
| 10 000 € | 500 € |
| 50 000 € | 2 500 € |
| 100 000 € | 5 000 € (plafonné) |

*Note : Le plafond de 15€/vente limite les revenus sur les grosses ventes*

---

## ⚠️ CAS PARTICULIERS

### Remboursement demandé
1. Si le virement n'est **pas encore fait** → Annulez la vente, remboursez via Stripe
2. Si le virement **est déjà fait** → Demandez au vendeur de vous rembourser d'abord

### Vendeur sans IBAN
1. Contactez le vendeur pour obtenir ses coordonnées bancaires
2. Demandez-lui de les ajouter dans son profil
3. En attendant, ne faites pas le reversement

### Litige acheteur/vendeur
1. Bloquez le reversement jusqu'à résolution
2. Médiatisez si nécessaire
3. Décidez qui a raison
4. Remboursez l'acheteur OU versez au vendeur

---

## 📊 TABLEAU DE BORD ADMIN

### URL : `/admin/ventes`

**Statistiques affichées :**
- 💰 Ventes totales
- 🎯 Commissions gagnées (votre revenu)
- ⏳ Montant à reverser
- ✅ Montant déjà reversé

**Fonctionnalités :**
- Voir toutes les ventes CB
- Filtrer par statut
- Voir les reversements par vendeur
- Marquer comme versé (unitaire ou groupé)
- Exporter en CSV

---

## 🏦 CONFIGURATION STRIPE

Votre compte Stripe doit être configuré avec :
- Clé API (déjà en place)
- Webhook pour recevoir les confirmations de paiement

**Dashboard Stripe :**
```
https://dashboard.stripe.com
```

Vérifiez régulièrement :
- Les paiements reçus
- Le solde disponible
- Les litiges éventuels

---

## 📞 SUPPORT

En cas de problème :
1. Vérifiez les logs : `docker logs worldauto-backend --tail 100`
2. Vérifiez Stripe Dashboard
3. Contactez le support si nécessaire

---

**Dernière mise à jour :** 19 janvier 2026
