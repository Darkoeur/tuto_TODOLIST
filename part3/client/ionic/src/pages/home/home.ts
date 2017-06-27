import { Component } from '@angular/core';
import { NavController, AlertController, Platform } from 'ionic-angular';
import { ZetaPushConnection } from 'zetapush-angular';
import { NotesManagerProvider } from '../../providers/notes-manager/notes-manager';
import { Note } from '../../api/notes-api.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [NotesManagerProvider]
})
export class HomePage {

    notes: Array<Note>;
    selection: Array<Note>;

    constructor(
        public navCtrl: NavController,
        public alertCtrl: AlertController,
        private platform: Platform,
        private zpConnection: ZetaPushConnection,
        private notesManager: NotesManagerProvider) {

            this.selection = [];

            this.notesManager.notes.subscribe(
                notes => {
                    console.log('The proxy sent us something : ', notes);
                    this.notes = notes;
                },
                error => { console.log(error) }
            );

        }

        ionViewDidEnter(): void {
            this.selection = [];
            this.notesManager.getNotes();
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
            if(this.selection.length > 0){
                var ids = this.selection.map(note => note.id);
                this.notesManager.deleteNotes(ids);
            } else {
                var ids = this.notes.map(note => note.id);
                this.notesManager.deleteNotes(ids);
            }
        }

        userRefresh() {
            this.notesManager.getNotes();
        }

        userDelete(deleted : Note) {
            var ids = [];
            ids.push(deleted.id);
            this.notesManager.deleteNotes(ids);
        }

        // New functionnality : select a note

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

}
