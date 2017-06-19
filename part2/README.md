# Réalisation d'une TODO liste avec ZetaPush #
*~ 20 minutes  
Concepts : service, stack, authentification*

## Introduction ##

Le prototype réalisé lors de la partie 1, bien que fonctionnel, ne profite pas à 100%
des macros déployées côté serveur. Par exemple le serveur implémente d'ores et déjà
de pouvoir supprimer en une fois plusieurs notes, alors que le client nous limite à une
note supprimée. Dommage non ?

Mais avant toute chose pour faciliter la maintenabilité et la lisibilité de notre client nous allons créer un service qui permettra d'abstraire les appels au serveur depuis le composant HomePage.
Ce service pourra ainsi être réutilisé à de multiples endroits de notre application, voire même dans un autre projet en modifiant quelque peu certaines parties du code !
