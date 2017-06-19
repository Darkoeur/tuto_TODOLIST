# Réalisation d'une TODO liste avec ZetaPush #
*~ 25 minutes  
Concepts : service, stack, authentification*

## Introduction ##

Cette partie sera l'objet d'une modification majeure : la façon de s'authentifier. Jusqu'à maintenant l'authentification se faisait automatiquement, et ce de manière transparente pour l'utilisateur. Certes dans le cas d'une simple todoliste cela ne pose aucun problème, mais cette authentification weak sera rarement d'usage dans des applications plus complexes déployées en production.

## Pré-requis ##

En considérant la partie 2 comme réalisée, pour cette seconde partie il vous suffit juste de reprendre votre projet.
Rien de nouveau à installer ou à configurer.

## Côté Client ##

Une page avec un formulaire nom/date de naissance (avec la date de naissance jouant le rôle d'un code d'accès) sera présentée à l'utilisateur.
A la réception de ce formulaire le serveur connecte la personne (en lui renvoyant un token de session) si les identifiants (le couple nom/date de naissance) existent,
et sinon créé une nouvelle personne avant de la connecter. En somme il s'agit de **réaliser un formulaire 2 en 1, connexion et/ou inscription si besoin est.**  

*Pour notre usage il serait possible de mémoriser les identifiants dans le localStorage du navigateur, mais on ne pourrait alors pas se connecter avec différents comptes et observer que les todolistes sont propres à chaque personne.*

`> ionic generate page door`

Le composant *src/pages/door/door.ts* qu'on renommera en *DoorPage* pour mieux illustrer son rôle de page de garde de l'application.

Puis l'on devra :
* importer *DoorPage* dans *AppModule*
* l'ajouter aux *declarations* du module
* l'ajouter aux *entryComponents* du module
* changer `rootPage:any = HomePage;` en `rootPage: any = DoorPage;` *app/app.component.ts*
* et enfin importer *DoorPage* dans *AppComponent*

En lançant l'application avec `> ionic serve` on arrive alors sur le composant *DoorPage*, ce qui correspond bien au comportement désiré.

Premièrement ajoutons-y un formulaire :  

```html
<!-- door.html - à l'intérieur de ion-content -->
<ion-list no-padding>

  <ion-item>
    <ion-label stacked>Nom</ion-label>
    <ion-input [(ngModel)]="name" type="text" placeholder="ex : Gaspard"></ion-input>
  </ion-item>

  <ion-item>
    <ion-label stacked>Date de naissance</ion-label>
    <ion-input [(ngModel)]="birthday" type="password" placeholder="ex: 01011970"></ion-input>
  </ion-item>

<button (click)="submit()" [disabled]="notCompleted()" ion-button full large color="primary">ENTRER</button>

</ion-list>
```

Puis développons les attributs associés aux inputs (**name** et **birthday**) et les fonctions rattachées au bouton, à savoir **submit()** et **notCompleted()** dans le composant *DoorPage*.
