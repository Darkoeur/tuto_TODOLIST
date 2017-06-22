import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/merge';
import { Note, NotesApi } from '../api/notes-api.service';


@Injectable()
export class NotesManager implements OnDestroy {

    // Using a Subject to subscribe and emit values
    private _notes: BehaviorSubject<Array<Note>> = new BehaviorSubject([]);

    // Not exposing it directly, in stead giving an Observable
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
            console.log('Remote server responded to an API call ', serverResponse);
            this._notes.next(serverResponse['notes']);
        },
        error => {
            alert('Le serveur a crash');
            alert(error);
            this._notes.error(error);
        }
    );

  }

  // CRUD OPERATIONS

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
