# Réalisation d'une TODO liste avec ZetaPush #
*~ 15 minutes  
Concepts : service, stack, authentification*

## Introduction ##

Le prototype réalisé lors de la partie 1, bien que fonctionnel, ne profite pas à 100%
des macros déployées côté serveur. Par exemple le serveur implémente d'ores et déjà
de pouvoir supprimer en une fois plusieurs notes, alors que le client nous limite à une
note supprimée. Dommage non ?

Mais avant toute chose pour faciliter la maintenabilité et la lisibilité de notre client nous allons créer un service qui permettra d'abstraire les appels au serveur depuis le composant HomePage.
Ce service pourra ainsi être réutilisé à de multiples endroits de notre application, voire même dans un autre projet en modifiant quelque peu certaines parties du code !

## Pré-requis ##

En considérant la partie 1 comme réalisée, pour cette seconde partie il vous suffit juste de reprendre votre projet.
Rien de nouveau à installer ou à configurer.

## Côté Serveur ##

Des modifications minimes sont à effectuer sur nos différentes macros **pushNote** et **deleteNotes**. Celles-ci vont désormais retourner la liste complète des notes de notre stack.
Plutôt que de recopier sauvagement le code de la macro **getNotes()**, il est possible d'utiliser le mot-clé *call* ainsi :
```javascript
...

var macroResult = call getNotes();
var notes = macroResult.result.notes;

} return { notes } on channel __selfName
```
Explicite non ? Une amélioration encore plus simple consiste à changer le *return* par *broadcast*. Ce seul changement va permettre de **broadcaster à tous les périphériques de l'utilisateur l'information** : en l'occurrence les notes. Dans le cadre de l'authentification weak - cf part 1 - l'utilisateur est assimilé au navigateur web et les périphériques ne sont rien d'autres que des onglets.  

Mais en optant pour l'authentification simple, plus traditionnelle avec par exemple un couple login/mot de passe, tous les périphériques (smartphone, ordinateur, objet connecté, etc...) d'un même utilisateur (personne, entreprise) seront synchronisés en temps réel !


## Côté Client ##

Voici pour rappel l'arborescence du src de notre client et plus particulièrement les fichiers sur lesquels nous allons travailler :  
```
.src/
+-- api/
|   +-- notes-api.service
+-- app/
|   +-- app.component
|   +-- app.module
+-- assets/
+-- pages/
|   +-- home/
|   |   +-- home.html
|   |   +-- home.ts
+-- theme/
```

Utilisons la commande `> ionic generate provider notes-manager` pour inscrire un nouveau service injectable à notre application. Il en résulte un nouveau fichier *src/providers/notes-manager.ts* ainsi qu'une modification du fichier *src/app/app.module.ts* pour pouvoir injecter le service NotesManagerProvider dans nos composants. *Selon la version d'Ionic, un dossier intermédiaire notes-manager/ peut avoir été créé.*

Faisons le bilan de l'état actuel du composant *HomePage*.
* À la construction, on subscribe aux différents observables renvoyés par NotesApi.
* À l'initialisation, lorsqu'on réussit à se connecter à ZetaPush, on demande au serveur les notes existantes.
* Enfin suite aux actions de l'utilisateur on effectue des appels à NotesApi.

À présent on va sortir toute cette logique du composant *HomePage*, pour l'attribuer à notre service nouvellement créé : *NotesManagerProvider*.

### NotesManagerProvider, pour un code plus propre ###

Voici le code de *src/providers/notes-manager.ts* que je détaillerai juste après.

```javascript
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/merge';
import { Note, NotesApi } from '../api/notes-api.service';


@Injectable()
export class NotesManagerProvider implements OnDestroy {

    // Using a Subject to subscribe and emit values
    private _notes: BehaviorSubject<Array<Note>> = new BehaviorSubject([]);

    // Showing an Observable instead of giving the Subject (security purpose)
    public readonly notes: Observable<Array<Note>> = this._notes.asObservable();

    subscription: any;

  constructor(private api: NotesApi) {

    // SUBSCRIBING THE DIFFERENT API OBSERVABLES
    // AND ACT AS A PROXY

    this.subscription = Observable.merge(
        this.api.onGetNotes,
        this.api.onPushNote,
        this.api.onDeleteNotes
    ).subscribe(
        serverResponse => {
            console.log('Proxy received a server response ', serverResponse);
            this._notes.next(serverResponse['notes']);
        },
        error => { console.log(error); }
    );

  }

  // CRUD OPERATIONS - these will be the functions called from HomePage

  pushNote(text: string): void {
      this.api.pushNote({content: text});
  }

  getNotes(): void {
      this.api.getNotes({});
  }

  deleteNotes(ids : Array<string>): void {
      this.api.deleteNotes({ids: ids});
  }

  resetNotes(): void {
      this.api.reset({});
  }

  ngOnDestroy(): void {
      this.subscription.unsubscribe();
  }

}
```

*NotesApi* permet d'interagir avec le serveur à un niveau très bas. Jusqu'à présent c'est ce service dont se servait *HomePage*, à présent *HomePage* devra utiliser le service *NotesManagerProvider*, qui se chargera à son tour de recourir à *NotesApi*.

Il est légitime de se demander pourquoi, et le code une fois mis à niveau de *src/pages/home/home.ts* sera un premier élément de réponse.
```javascript

import { Component, OnInit } from '@angular/core';
import { NavController, AlertController, Platform } from 'ionic-angular';
import { ZetaPushConnection } from 'zetapush-angular';
import { NotesManagerProvider } from '../../providers/notes-manager';
import { Note } from '../../api/notes-api.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [NotesManagerProvider]
})
export class HomePage implements OnInit {

    notes: Array<Note>;

    constructor(
        public navCtrl: NavController,
        public alertCtrl: AlertController,
        private platform: Platform,
        private zpConnection: ZetaPushConnection,
        private notesManager: NotesManagerProvider) {

            this.notesManager.notes.subscribe(
                notes => {
                    console.log('The proxy sent us something : ', notes);
                    this.notes = notes;
                },
                error => { console.log(error) }
            );

        }

        ngOnInit(): void {
            this.platform.ready().then(() => {
                this.zpConnection.connect().then(() => {
                    // getting notes from server after connection
                    this.notesManager.getNotes();
                });
            });
        }

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
                            this.notesManager.pushNote(data.text);
                        }
                    }
                ]
            });
            form.present();
        }

        userClear() {
            this.notesManager.resetNotes();
            // The reset macro doesn't send us anything, that's why
            // we "manually" reset the notes array
            this.notes = [];
        }

        userRefresh() {
            this.notesManager.getNotes();
        }

        userDelete(deleted : Note) {
            var ids = [];
            ids.push(deleted.id);
            this.notesManager.deleteNotes(ids);
        }

}

```

Beaucoup plus clair non ? Un seul Observable à gérer et des fonctions encore plus simples qui ne nécessitent pas la connaissance de l'API.
Par exemple `this.notesApi.pushNote({content:data.text});` devient `this.notesManager.pushNote(data.text);`.  
Les *console.log* permettent de retracer dans la console du navigateur le fonctionnement de l'application et aident à la compréhension.

### Ajout de fonctionnalité ###

Ajoutons un attribut `selection: Array<Note> = [];` au composant *HomePage*, et créons deux fonctions pour respectivement sélectionner une note et savoir si une note est sélectionnée.

```javascript
userSelect(note: Note){

    if(this.isSelected(note)){
        this.selection.splice(this.selection.indexOf(note), 1);
    } else {
        this.selection.push(note);
    }

}

isSelected(note: Note): boolean {
    return (this.selection.indexOf(note) !== -1);
}
```

Puis modifions la fonction existante *userClear()* pour changer son comportement : réinitialisation de la todo liste seulement si aucune note sélectionnée, sinon suppression de toutes les notes sélectionnées.

```javascript
userClear() {
    if(this.selection.length > 0){
        var ids = this.selection.map(note => note.id);
        this.notesManager.deleteNotes(ids);
    } else {
        this.notesManager.resetNotes();
        this.notes = [];
    }
}
```

Côté javascript c'est fini, il ne reste plus qu'à modifier le HTML/CSS pour pouvoir en profiter :)
```html
<!-- fichier home.html -->
...
<ion-card *ngFor="let note of notes" (click)="userSelect(note)" [ngClass]="{faded: isSelected(note)}">
    <ion-card-content>
        <ion-list>
            <ion-item>
                <p>{{note.text}}</p>
                <ion-icon item-end [ngClass]="{notSelected: !isSelected(note)}" name="trash"></ion-icon>
            </ion-item>
        </ion-list>
    </ion-card-content>
</ion-card>
...
```

```css
/* fichier home.scss */

...

.notSelected {
    visibility: hidden;
}

.faded {
    opacity: 0.2;
    transition: 0.3s;
}

```


Et voilà ! Désormais il est possible de sélectionner des notes et de supprimer la sélection. On pourra réutiliser ce principe de sélection pour d'autres fin, qui feront l'objet des prochaines parties de ce tutoriel.
