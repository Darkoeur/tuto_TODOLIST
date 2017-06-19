import { Component, OnInit } from '@angular/core';
import { NavController, AlertController, Platform } from 'ionic-angular';
import { ZetaPushConnection } from 'zetapush-angular';
import { NotesManager } from '../../providers/notes-manager';
import { Note } from '../../api/notes-api.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [NotesManager]
})
export class HomePage implements OnInit {

    notes: Array<Note>;
    selection: Array<Note>;

    constructor(
        public navCtrl: NavController,
        public alertCtrl: AlertController,
        private platform: Platform,
        private zpConnection: ZetaPushConnection,
        private notesManager: NotesManager) {

            this.selection = [];

            this.notesManager.notes.subscribe(
                notes => {
                    console.log('Well received captain ! ', notes);
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
                this.notesManager.resetNotes();
                this.notes = [];
            }
        }

        userRefresh() {
            this.notesManager.getNotes();
        }

        userSelect(note: Note){

            if(this.isSelected(note)){
                this.selection.splice(this.selection.indexOf(note), 1);
            } else {
                this.selection.push(note);
            }

        }

        isSelected(note: Note): boolean {
            return (this.selection.indexOf(note) === -1);
        }

}
