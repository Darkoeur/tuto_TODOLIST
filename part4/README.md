# Réalisation d'une TODO liste avec ZetaPush #
*~ 30 minutes  
Concepts : recipe, superuser, permissions*

## Introduction ##

Jusqu'à maintenant nos modifications portaient principalement sur la partie client, tout en effectuant quelques modifications mineures sur la partie ZetaPush.
On va à présent connecter les utilisateurs entre eux et remplacer les todolistes individuelles par une seule et même todoliste partagée entre tous les utilisateurs.  

Le meilleur dans tout ça ? Du côté client il n'y aura que 3 modifications : l'interface Note, le template HTML et le CSS associé.

## Pré-requis ##

En considérant la partie 3 réalisée, il est nécessaire d'importer dans Eclipse la recette Utils et la recette Group que vous pourrez obtenir sur le dépôt github officiel, [zetapush/zetapush-recipes](https://github.com/zetapush/zetapush-recipes).

Ces recettes vont nous permettre d'interagir plus facilement avec le service de Groupe de Zetapush et lui ajoute des fonctionnalités supplémentaires (par exemple la possibilité d'attribuer des tags à un groupe, ainsi que des metadata).
