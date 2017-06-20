# Réalisation d'une TODO liste avec ZetaPush #
*~ 25 minutes  
Concepts : service, stack, authentification*

## Introduction ##

Cette partie sera l'objet d'une modification majeure : la façon de s'authentifier. Jusqu'à maintenant l'authentification se faisait automatiquement, et ce de manière transparente pour l'utilisateur. Certes dans le cas d'une simple todoliste cela ne pose aucun problème, mais cette authentification weak sera rarement d'usage dans des applications plus complexes déployées en production.

## Pré-requis ##

En considérant la partie 2 comme réalisée, pour cette troisième partie il vous suffit juste de reprendre votre projet.
Rien de nouveau à installer ou à configurer.  

Attention, dans cette partie certains imports ne seront pas précisés explicitement, notamment dans le cas simple où l'on se sert d'une instance d'un controleur, par exemple LoadingController. Le but étant de progressivement se concentrer sur les modifications propres au serveur.  
Si votre IDE supporte TypeScript il se peut que les imports manquants vous soient signalés.

## Côté Client ##

Une page avec un formulaire login/password sera présentée à l'utilisateur.
À la réception de ce formulaire on tente de se connecter avec les identifiants donnés. Si cela échoue, on va se connecter en anonyme pour pouvoir créer le compte. Puis l'on va retenter de se connecter en authentification simple, ce qui devrait réussir.

*Pour notre usage il serait possible de mémoriser les identifiants dans le localStorage du navigateur pour outrepasser la page de connexion.*

`> ionic generate page door-page`

Le composant *src/pages/door-page/door-page.ts* aura un rôle de page de garde de l'application.

Une fois généré, il faudra :
* importer *DoorPage* dans *AppModule*
* l'ajouter aux *declarations* du module
* l'ajouter aux *entryComponents* du module
* changer `rootPage:any = HomePage;` en `rootPage: any = DoorPage;` dans *app/app.component.ts*
* importer *DoorPage* dans *AppComponent*


En lançant l'application avec `> ionic serve` on arrive alors sur le composant *DoorPage*, ce qui correspond bien au comportement désiré.

Premièrement ajoutons-y un formulaire :  

```html
<!-- door-page.html - à l'intérieur de ion-content -->
<ion-list no-padding>

  <ion-item>
    <ion-label stacked>Login</ion-label>
    <ion-input [(ngModel)]="login" type="text" placeholder="ex : Gaspard"></ion-input>
  </ion-item>

  <ion-item>
    <ion-label stacked>Password</ion-label>
    <ion-input [(ngModel)]="password" type="password" placeholder="ex: easypassword123"></ion-input>
  </ion-item>

<button (click)="submit()" [disabled]="notCompleted()" ion-button full large color="primary">ENTRER</button>

</ion-list>
```

Puis développons les attributs associés aux inputs (**login** et **password**) et les fonctions rattachées au bouton, à savoir **submit()** et **notCompleted()** dans le composant *DoorPage*.
La fonction *submit()* souhaitant établir une connexion à Zetapush, il faut rajouter `import { ZetaPushConnection } from 'zetapush-angular';` dans l'en-tête du composant.

```javascript
// pages/door/door.ts
...
    login: string;
    password: string;
    waitingMsg: any;

    constructor(private zp: ZetaPushConnection, public loadingCtrl: LoadingController, ...) { }

    notCompleted(): boolean {
        return (!this.login || !this.password);
    }

    submit(): void {
        // ???
    }
```

Que mettre dans le code de la fonction **submit()** ? Il va être nécessaire de définir deux services, une API pour communiquer avec le serveur (cf partie 1) et un service pour faciliter encore plus cette communication (cf partie 2). Comme nous allons interagir avec ce dernier service et non pas l'API on peut tout de même programmer la fonction ainsi;

```javascript
submit(): void {
    this.waitingMsg = this.loadingCtrl.create({
        content: 'Communicating with server...'
    });
    this.waitingMsg.present();

    if(!this.notCompleted()){
        this.zp.connect({login: this.login, password: this.password}).then(
            () => {
                // Success
                this.waitingMsg.dismiss();
            },
            error => {
                // Failure, account may not exist yet
                this.createAccount();
            }
        );
    }
}

private createAccount(): void {
    this.zp.connect().then(
        () => {
            // As we're connected anonymously
            // We have the right to execute macros on server
            // TODO : Call macro
            this.waitingMsg.dismiss();
        },
        error => {
            // Should not happen except if server error
        }
    );
}
```

Pour l'utilisateur final tout ce fonctionnement d'authentification simple et anonyme est caché, et la création de son compte se fait de manière invisible pour lui.

## Côté Serveur ##

Une première modification à effectuer une fois sous Eclipse est le mode d'authentification, ajoutez un nouveau service avec la ligne `service auth = simple(__default);`, juste en dessous de notre service d'authentification weak, dans *recipe.zms*. On aura donc deux manière de s'authentifier, une façon anonyme et une façon traditionnelle avec login/mot de passe.

Au déploiement (fusée rouge), nous allons créer un utilisateur. Pour cela, il suffit de créer un fichier *init.zms* au même endroit que le fichier *recipe.zms*, autrement dit à la racine du projet.

```javascript
/* fichier init.zms */
auth.memauth_createUser({
	login: "gaspard",
	password: "01011970"
});
```

Ce fichier comme son nom l'indique sera lancé après le déploiement et permet de bootstraper notre serveur.
Pour qu'il soit effectif on déploie donc nos services.

Dans le répertoire *src/* on va créer une macro dans un nouveau fichier, qui permettra de créer un utilisateur.

```javascript

macroscript create(string login, string password) {

    var user = auth.createUser({
		'login': name,
		'password': password
	});

} return {user} on channel __selfName

```

On n'oublie pas de déployer le code de la macro grâce à l'icône avec quatre carrés, et voilà, on a fini du côté du serveur !

## Côté Client ##

Jetez tout d'abord un coup d'oeil au fichier *api/notes-api.service.ts*. Objectif de cette partie : faire une api qu'on nommera *users-api.service.ts* et qui permettra (pour l'instant) uniquement d'appeler la macro de création de compte faite précédemment.

```javascript

// fichier src/api/users-api.service.ts
import { NgZone } from '@angular/core';
import { Api, ZetaPushClient, createApi } from 'zetapush-angular';

export class UsersApi extends Api {

	// Names MUST match the macros on server

	create({login, password}: { login: string, password: string}): Promise<any> {
		return this.$publish('create', {login, password});
	}

}

export function UsersApiFactory(client: ZetaPushClient, zone: NgZone): UsersApi {
    return createApi(client, zone, UsersApi) as UsersApi;
}

export const UsersApiProvider = {
	provide: UsersApi, useFactory: UsersApiFactory, deps: [ ZetaPushClient, NgZone ]
}

```

*...une fois correctement importée dans AppModule et inscrit en tant que provider...*

On va pouvoir s'en servir dans un nouveau service similaire au service *NotesManager* !  
Création avec `> ionic generate provider users-handler`, puis on notifie *AppModule* de l'existence de notre nouveau service (traduction: on l'importe et on l'ajoute à ses providers).

Voici ci-dessous le code final du service *UsersHandler*.  

```javascript
// fichier providers/users-handler.ts
import { Injectable } from '@angular/core';
import { UsersApi } from '../api/users-api.service';

@Injectable()
export class UsersHandler {

  constructor(private api: UsersApi) { }

  // No need observable here
  createAccount(loginWanted: string, passwordWanted: string): Promise<any> {
      return this.api.create({login: loginWanted, password: passwordWanted});
  }
}
```

Et ensuite on utilise celui-ci au sein de *DoorPage*.

```javascript
...
import { UsersHandler } from '../../providers/users-handler';
import { HomePage } from '../home/home';

@IonicPage()
@Component({
    selector: 'page-door', templateUrl: 'door.html', providers: [UsersHandler]
})
export class DoorPage {

    ...

    constructor(private usersHandler: UsersHandler, ...) { }

    ...

      submit(): void {

          this.password = '';

          this.waitingMsg = this.loadingCtrl.create({
              content: 'Communicating with server...'
          });
          this.waitingMsg.present();

          if(!this.notCompleted()){
              this.zp.connect({login: this.login, password: this.password}).then(
                  () => {
                      // Success
                      this.waitingMsg.dismiss();
                      this.navCtrl.push(HomePage);
                  },
                  error => {
                      // Failure, account may not exist yet
                      this.createAccount();
                  }
              );
          }
      }

      private createAccount(): void {
          this.zp.connect().then(
              () => {
                  // As we're connected anonymously
                  // We have the right to execute macros on server
                  this.usersHandler.createAccount(this.login, this.password).then(
                      () => {
                          // Account created
                          this.waitingMsg.dismiss();
                          this.navCtrl.push(HomePage);
                      },
                      error => {
                          this.waitingMsg.dismiss();
                          this.show(error[0]);
                      }
                  );

              },
              error => {
                  // Should not happen except if server error
              }
          );
      }

      private show(error): void {

          let msg = 'Le serveur n\'a pas pu créer le compte.';

          switch(error.code) {
              case 'ACCOUNT_EXISTS':
                    msg = 'Mauvais mot de passe !';
                    break;
          }

          let alertMsg = this.alertCtrl.create({
             title: error.code,
             subTitle: msg,
             buttons: ['OK']
          });

          alertMsg.present();
      }

}
```

Voilà ! Et comme vous l'aurez constaté on gère même le cas où une erreur survient lors de la création du compte !
Cette partie peut paraître un peu longue mais il est intéressant d'observer la proportion de code client par rapport
à la proportion de code serveur, et ce que facilite Zetapush.  
De surcroît, on a pu revenir sur une décision assez fondamentale (comment s'authentifier) et cela ne change strictement rien du point
de vue de la gestion des notes.

Petit détail mais qui a son importance, pensez à changer le **ngOnInit()** de *HomePage* ;)

```javascript
ionViewDidEnter(): void {
    this.selection = [];
    this.notesManager.getNotes();
}
```

Vous pouvez également vous connecter sur votre téléphone et sur votre ordinateur pour constater que l'ajout d'une note est répercuté sur les deux terminaux :)
