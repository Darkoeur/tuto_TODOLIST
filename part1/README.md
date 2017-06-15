# Réalisation d'une TODO liste avec ZetaPush #
*~ 20 minutes  
Concepts : service, stack, authentification*

## Introduction ##

ZetaPush en tant que Backend as a Service temps réel va nous permettre d'accélerer grandement notre développement côté serveur pour pouvoir rapidement se concentrer sur la partie client.

Une TODO liste est un exemple parfait pour faire ses premiers pas avec ZetaPush, et pourra facilement être agrémenté de fonctionnalités comme des catégories, l'ajout d'un calendrier, de notifications, etc..

Dans un premier temps nous allons nous concentrer sur un ensemble restreint de possibilités :
* ajouter une note
* supprimer une note
* supprimer toutes les notes

### Prérequis ###

Dans ce tutoriel, nous avons besoin d'*Eclipse*, d'*Angular* et d'*Ionic 2* donc veuillez les installer si nécessaire.

* **Eclipse** : [Téléchargement](https://www.eclipse.org/downloads/)
* **Angular** : `npm install -g @angular/cli`
* **Ionic** : `npm install -g ionic cordova`

Le plugin ZetaPush pour Eclipse sera également requis, de même qu'une *sandbox* fonctionnelle sur la plateforme ZetaPush. Vous pourrez obtenir la marche à suivre en lisant le [Quickstart](https://doc.zetapush.com/quickstart/), parties *Sandbox Configuration* et *Setup your environment*.

## Côté ZetaPush ##

### Services ###

Dans Eclipse, créons à présent une recette en accédant au wizard : File > New > Project > Zetapush > ZMS Recipe. Pour continuer il est alors nécessaire de confirmer les informations suivantes :
* Recipe name : le nom du projet
* Developer login/password : vos identifiants de connexion à l'interface d'administration web de Zetapush
* Sandbox id : l'identifiant de la sandbox, visible sur l'interface d'administration

Une fois le projet créé en cliquant sur *Finish*, divers répertoires et fichiers sont créés.
Les fichiers *.properties* ont normalement été pré-configurés avec les informations entrées lors de la création du projet.
Le fichier *recipe.zms* indique les différents services utilisés par le projet, chacun de ces services s'apparentant à un bloc de fonctionnalités avec lequel il nous sera possible d'interagir.

Le fichier *init.zms* utilise ainsi le service d'authentification simple pour créer un utilisateur de test, avec les informations fournies dans le fichier *zms.properties*. Supprimons à présent le fichier *init.zms*, et changeons le type d'authentification de simple à weak. Pour cela rien de plus simple :

Il suffit de remplacer `service auth = simple(__default);` par `service auth = weak(__default);` !

**L'authentification weak consiste en une authentification anonyme, le client se connecte à ZetaPush sans identifiant, un token lui est transmis en retour qu'il doit alors mémoriser. La perte de ce token équivaudrait inévitablement à la perte des données qui lui sont associées.**

Notre TODO liste impliquera nécessairement un stockage côté serveur. Pour cela nous utiliserons le service [Data Stacks](https://ref.zpush.io/#it_stack) bien qu'un Generic Data Access puisse également faire l'affaire, la simplicité d'utilisation des Stacks convient parfaitement à notre usage :)
Dans *recipe.zms*, déclarez le service ainsi : `service stacks = stack(__default);`

Dans le fichier *zms.user.properties*, mettre à *true* l'upload de code.
Déployons ensuite nos services !  
![alt text](http://mikael-morvan.developpez.com/tutoriels/zetapush/galerie-photo/images/DeployRecipe.png "La fusée permet de déployer les services de notre recette")

### Macroscripts ###
Suite au succès du déploiement, écrivons les macros qui vont nous autoriser à interagir avec les services.

Un macroscript welcome est déjà défini dans le fichier *src/welcome.zms*, qu'il est possible de tester avec le bouton Play orange, en oubliant pas de cliquer à l'intérieur du code de la macro. L'intérêt est limité, supprimons la et écrivons à présent quatre macros;
* **pushNote(string content)**
* **getNotes()**
* **deleteNotes(array ids)**
* **reset()**

Le nom est suffisamment explicite, passons sans plus attendre au code du fichier *src/welcome.zms* :
```javascript
macroscript pushNote (string content = "Nothing") {

	var insertion = stacks.push({stack : 'TODO', data : {text:content}});
	var note = {
		id: insertion.guid,
		text: content
	};

} return {note} on channel __selfName
```
```javascript
macroscript getNotes () {

	var query = stacks.list({stack : 'TODO'});
	var rawNotes = query.result.content;
	var notes = [];
	for note in rawNotes {
			var formated = {id: note.guid, text: note.data.text};
			notes = list:add(notes, formated);
	}

} return {notes} on channel __selfName
```
```javascript
macroscript deleteNotes (array ids) {

	stacks.remove({stack : 'TODO', guids: ids});

} return {} on channel __selfName
```
```javascript
macroscript reset () {

	stacks.purge({stack : 'TODO'});

// we won't need the server response after calling the reset macro
} return {}
```

Pour envoyer au serveur nos macros, déployons le code avec l'icône juste à gauche de la fusée.  
**Et voilà, nous avons fini avec la partie serveur de l'application, il ne nous reste plus qu'à créer un client pour interagir avec !**

## Côté Client ##

Le client sera réalisé sous la forme d'une application Ionic, mais il serait aussi facile de procéder à un client en HTML/javascript standard.

### Configuration ###

Crééons le projet et configurons le :    
```bash
> ionic start <APPNAME> blank --type=ionic-angular
> cd <APPNAME>
> cordova platform add android
> npm install zetapush-js --save
> npm install zetapush-angular --save
```
**ZetaPush utilise la version 4 d'Angular, plus d'informations sur [le blog officiel](http://angularjs.blogspot.fr/2017/03/angular-400-now-available.html)**

Importons à présent ZetaPush dans notre application en modifiant le fichier *src/app/app.module.ts* :  

```javascript
import { ZetaPushClientConfig, ZetaPushModule } from 'zetapush-angular';
...
imports: [
    ...,
    ZetaPushModule
],
...
providers: [
    ...,
    { provide: ZetaPushClientConfig, useValue: {sandboxId: '<yourId>'} }
]
```

Puis dans le fichier *src/pages/home/home.ts* - qui constitue notre composant principal - établissons une connexion à ZetaPush :  

```javascript
import { Component, OnInit } from '@angular/core';
import { NavController, AlertController, Platform } from 'ionic-angular';
import { ZetaPushConnection } from 'zetapush-angular';

...

export class HomePage implements OnInit {

        constructor(
            public navCtrl: NavController,
            public alertCtrl: AlertController,
            private platform: Platform,
            private zpConnection: ZetaPushConnection) {}

        ngOnInit(): void {

            this.platform.ready().then(() => {
                this.zpConnection.connect().then(() => {
                    console.debug("ZetaPushConnection:OK");
                });
            });
        }
}
```  
À ce stade il est d'ores et déjà possible de tester l'application client avec la commande `> ionic serve` qui la déploie à l'adresse `http://localhost:8100/`.

### Code ###  

Pour gagner du temps voici le template qui permettra de présenter les notes de notre TODO liste, il ne tient qu'à vous de le modifier en vous basant sur les [composants ionic](https://ionicframework.com/docs/components/) et votre imagination personnelle. Il correspond au contenu du fichier *src/pages/home/home.html*.

```html
<!-- en-tête de notre application -->
<ion-header>
    <ion-navbar color="primary" no-border-bottom>
        <ion-title>
            <ion-icon name="albums"></ion-icon>
            My Todo List
        </ion-title>
    </ion-navbar>
</ion-header>

<ion-content>
    <ion-list>
        <!-- chaque note sera représentée de la sorte : -->
        <ion-card *ngFor="let note of notes">
            <ion-card-content>
                <p>{{note.text}}</p>
            </ion-card-content>
            <ion-row padding>
                <ion-col>
                    <button (click)="userDelete(note)" ion-button clear small color="dark" icon-only>
                        <ion-icon name="trash"></ion-icon>
                    </button>
                </ion-col>
            </ion-row>
        </ion-card>
    </ion-list>

    <!-- on propose à l'utilisateur trois boutons -->
    <button round (click)="userRefresh()" id="refreshButton" class="actionButtons" color="dark" ion-button icon-only>
        <ion-icon name="refresh"></ion-icon>
    </button>
    <button round (click)="userAddNote()" id="addButton" class="actionButtons" color="primary" ion-button icon-only>
        <ion-icon name="add"></ion-icon>
    </button>
    <button round (click)="userClear()" id="clearButton" class="actionButtons" color="danger" ion-button icon-only>
        <ion-icon name="trash"></ion-icon>
    </button>

</ion-content>
```

Modifions le css à appliquer en changeant le contenu de *src/pages/home/home.scss* de la sorte :  
```css
.actionButtons {
    position: fixed;
    right: 30px;
    width: 50px;
    height: 50px; 	
}

#clearButton { bottom: 20px; }
#addButton { bottom: 90px; }
#refreshButton { bottom: 160px; }
```

Pour garantir un code clair, nous allons définir une API de gestion de notes. Celle-ci sera contenue dans la fichier *src/api/notes-api.service.ts*. Ni le fichier ni le répertoire n'existent, il vous faudra donc les créer au préalable.

```javascript
// fichier src/api/notes-api.service.ts
import { NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Api, ZetaPushClient, createApi } from 'zetapush-angular';

// représentation d'une note
export interface Note {
    id: string,
    text: string
}

// A feature will implement auto-generation
// of the code below in the future
export class NotesApi extends Api {

	// Observables to catch the server response
	// They act as listeners
	onPushNote: Observable<any>;
	onGetNotes: Observable<any>;
	onDeleteNotes: Observable<any>;

	// Names MUST match the macros on server

	pushNote({content}){
		return this.$publish('pushNote', {content});
	}

	getNotes({}){
		return this.$publish('getNotes', {});
	}

	deleteNotes({ids} : { ids : Array<string> }){
		return this.$publish('deleteNotes', {ids});
	}

	reset({}){
		return this.$publish('reset', {});
	}

}

export function NotesApiFactory(client: ZetaPushClient, zone: NgZone): NotesApi {
    return createApi(client, zone, NotesApi) as NotesApi;
}

export const NotesApiProvider = {
	provide: NotesApi, useFactory: NotesApiFactory, deps: [ ZetaPushClient, NgZone ]
}
```

Reprenons le code du fichier *src/app/app.module.ts* pour y intégrer l'API nouvellement créée.  

```javascript
import { NotesApiProvider } from '../api/notes-api.service';
...
providers: [
    ...
    NotesApiProvider
]
...
```

Bonne nouvelle : c'est presque terminé ! Il ne reste désormais plus qu'à configurer les appels à notre API depuis notre composant principal *home* correspondant au fichier *src/pages/home/home.ts*.

```javascript
...
import { Note, NotesApi } from '../../api/notes-api.service';
...

export class HomePage implements OnInit {

    // where we will store our notes
    notes : Array<Note> = [];

    constructor(
        public navCtrl: NavController,
        public alertCtrl: AlertController,
        private platform: Platform,
        private zpConnection: ZetaPushConnection,
        private api: NotesApi) {

            // we set listeners to handle server response
            api.onGetNotes.subscribe((response) => {
                this.notes = [];
                response['notes'].forEach(note => {
                    this.notes.push(note);
                });
            });

            api.onPushNote.subscribe((response) => {
                this.notes.unshift(response['note']);
            });

            api.onDeleteNotes.subscribe((response) => {
                this.api.getNotes({});
            });

        }

        ngOnInit(): void {
            this.platform.ready().then(() => {
                this.zpConnection.connect().then(() => {
                    // getting notes from server after connection
                    this.api.getNotes({});
                });
            });
        }

        // functions user will trigger with buttons
        userAddNote() {
            let form = this.alertCtrl.create({
                title : 'Add a note',
                message : 'Enter the text of the note here',
                inputs: [
                    {
                        name: 'text',
                        placeholder: ''
                    }
                ],
                buttons: [
                    {
                        text: 'Cancel',
                        handler: data => {
                            // nothing
                        }
                    },
                    {
                        text: 'Add',
                        handler: data => {
                            this.api.pushNote({content:data.text});
                        }			
                    }
                ]
            });
            form.present();
        }

        userClear() {
            this.api.reset({});
            this.notes = [];
        }

        userRefresh() {
            this.api.getNotes({});
        }

        userDelete(deleted : Note) {
            var ids = [];
            ids.push(deleted.id);
            this.api.deleteNotes({ids});
        }		

}
```

Beaucoup de code mais rien de bien compliqué, des fonctions émettent des ordres au serveur  et l'on écoute la réponse de ce dernier au travers de souscriptions.  
Pour lancer l'application, `ionic serve` et le tour est joué !
