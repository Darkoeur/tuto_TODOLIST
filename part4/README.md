# Réalisation d'une TODO liste avec ZetaPush #
*~ 25 minutes  
Concepts : recipe, superuser, permissions*

[screenshot_arborescence]: https://wires.fr/imgs/todolist-part4-001-arborescence.png "Structure expected"


## Introduction ##

Jusqu'à maintenant nos modifications portaient principalement sur la partie client, tout en effectuant quelques modifications mineures sur la partie ZetaPush.
On va à présent connecter les utilisateurs entre eux et remplacer les todolistes individuelles par une seule et même todoliste partagée entre tous les utilisateurs.  

Le meilleur dans tout ça ? Du côté client il n'y aura que 3 modifications : l'interface Note, le template HTML et le CSS associé.

## Pré-requis ##

En considérant la partie 3 réalisée, il est nécessaire d'importer dans Eclipse la recette Utils et la recette Group que vous pourrez obtenir sur le dépôt github officiel, [zetapush/zetapush-recipes](https://github.com/zetapush/zetapush-recipes).

Ces recettes vont nous permettre d'interagir plus facilement avec le service de Groupe de Zetapush et apportent des fonctionnalités supplémentaires déjà codées (par exemple la possibilité d'attribuer des tags à un groupe, ainsi que des metadata).

*Procédure : File > Import > Git > Projects from Git > Next > Clone URI > URI : https://github.com/zetapush/zetapush-recipes.git > Next > Next > Next > Sélectionner les recipes requises > Finish*

## Côté Serveur ##

### Configuration ###

Actuellement notre répertoire *src/* contient deux fichiers, *welcome.zms* et *userCreation.zms*.
Renommez *welcome.zms* en *notes.zms* et *userCreation.zms* en *create.zms* puis placez ces deux fichiers dans un répertoire *src/users/* qu'il vous faudra créer au préalable.
Créez également un répertoire *src/groups/*.

Désormais nous devrions avoir sous Eclipse une arborescence comme celle-ci :  
![alt text][screenshot_arborescence]

Donnons accès à la recette Group et à la recette Utils. Pour cela deux étapes, *clic droit sur notre projet > Properties > Project References > cochez les deux recettes* La seconde étape consiste à les importer dans notre *recipe.zms*.

```javascript

recipe com.zetapush.tutorials.todolist.verification 1.0.0;

import recipe com.zetapush.core.group 2.0.0 in zpRecipeGroup;
import recipe com.zetapush.core.utils 2.0.0 in zpRecipeUtils;

/** Definition of const */
const GROUP_DEFAULT_ID = 'norandomid';
const GROUP_DEFAULT_NAME = 'GLOBAL_REALM';
const GROUP_SERVICE_DEPLOYMENT_ID = 'cr_grp_groups';

const STACK_SERVICE_DEPLOYMENT_ID = 'stack_0';

/** Expliciting the services needed */

/** authentication needed for account creations */
service authAnonymous = weak(__default);

/** authentication with login/password */
service auth = simple(__default);

/** macros proposed to client */
service code = macro(__default) for 'src';

/** stacks service to store notes */
service stacks = stack(STACK_SERVICE_DEPLOYMENT_ID).forbiddenVerbs(__all);

/** service giving access to the users informations*/
service users = userdir(__default).forbiddenVerbs(__all);

/** service allowing to create and manipulate groups */
service groups = groups(GROUP_SERVICE_DEPLOYMENT_ID).options({
	groups_presence_owner: false,
	groups_presence_group: false
}).forbiddenVerbs(__all);
```

Deux choses intéressantes :
* `import recipe com.zetapush.core.group 2.0.0 in zpRecipeGroup` nous donne accès à un objet zpRecipeGroup qui permettra d'appeler les macroscripts contenus dans la recette Group.

* `.options({...}).forbiddenVerbs(__all)` permet respectivement de configurer les options d'un service, et de limiter son utilisation. L'utilisateur sera contraint de se servir de nos macros pour interagir avec le service.

### Le vif du sujet : API GroupStack ###

Désormais supprimez le contenu du fichier *init.zms* et vous pourrez ensuite déployer la recette (fusée rouge).
Si pas d'erreur signalée vous pouvez continuer ! Sinon n'hésitez pas à relire l'étape d'avant et vérifier que les recettes ont correctement été importées.  

Notre but à présent va être de créer un ensemble de macroscripts cohérents pour **pouvoir créer/lire/écrire/supprimer dans un stack partagé**.
Une notion importante à garder à l'esprit est que dans ZetaPush, par défaut les ressources sont propres à un utilisateur.  

Chaque ressource appartient à un utilisateur et la seule manière qu'un autre utilisateur a d'accéder à une ressource qui n'est pas la sienne, c'est qu'il dispose *des permissions nécessaires*. Ces permissions ne peuvent être accordées que par le propriétaire de la ressource.  

Créons une première macro *src/groups/createGroupAndStack.zms* :

```javascript
/** create a group and a stack in a public area */
macroscript createGroupAndStack (
	/** must be uniq and alpha-numerical */ string groupId,
	/** alpha-numerical */ string groupName
) {

	// group creation

	var group = sudo zpRecipeUtils::GLOBAL_OWNER call zpRecipeGroup::createGroup({
		id: groupId,
		name: groupName
	}) hardFail;


	// stack creation

	var firstNote = {
		text: 'Amusez-vous bien !',
		date: time:now(),
		author: 'Creator',
		authorKey: zpRecipeUtils::GLOBAL_OWNER
	};

	sudo zpRecipeUtils::GLOBAL_OWNER stacks.purge({
		stack: groupName
	});

	var stack = sudo zpRecipeUtils::GLOBAL_OWNER stacks.push({
		stack: groupName,
		data: firstNote
	});

	// linking stack and group together thanks to listeners

	var groupKey = GROUP_SERVICE_DEPLOYMENT_ID + ':' + zpRecipeUtils::GLOBAL_OWNER + ':' + groupName;
	var listeners = sudo zpRecipeUtils::GLOBAL_OWNER stacks.setListeners({
		listeners : [groupKey],
		stack : groupName
	});

	// grant access to stack

	var grant = sudo zpRecipeUtils::GLOBAL_OWNER call grantAccessToGroupStack({groupId : groupId}) hardFail;

} return { }

```

Expliquons tout d'abord deux nouvelles choses :
* le mot-clé **hardFail**, précédé d'un appel de macro, indique que si la macro appelée génère une erreur on propage l'erreur à la macro appelante - ce qui met fin à l'exécution de celle-ci.
* **sudo zpRecipeUtils::GLOBAL_OWNER** permet d'indiquer qu'on se fait passer pour un autre utilisateur, en l'occurence un utilisateur global qui nous est fourni par la recette Utils.

Le fonctionnement de la macro est de créer un groupe appartenant à GLOBAL_OWNER, puis de lui créer un stack.

On ajoute le groupe aux listeners du stack avec la fonction *setListeners*. Chaque modification apportée au stack sera à présent notifiée au groupe (et donc à chacun de ses membres).  

Enfin on appelle une macro pas encore définie qui va se charger d'autoriser le groupe (ie ses membres) à modifier le stack. Pas si compliqué en somme ?  

Créons un nouveau fichier *src/groups/grantAccessToGroupStack.zms* pour contenir la macro du même nom.

```javascript
macroscript grantAccessToGroupStack (
	/** must be uniq and alpha-numerical */ string groupId
) {

	var myStackResource =  STACK_SERVICE_DEPLOYMENT_ID + ':' + zpRecipeUtils::GLOBAL_OWNER + ':' + GROUP_DEFAULT_NAME;

	groups.grant({
		resource: myStackResource,
		group: groupId,
		action: '*',
		owner: zpRecipeUtils::GLOBAL_OWNER
	});
}
```

Les ressources sont identifiées selon une chaîne de caractère au format "**serviceDeploymentId:userKeyOfResourceOwner:resourceIdOrName**", reportez vous à la doc du service en question pour plus d'informations.  
Une autre macro est requise pour la suite, à créer dans *src/groups/addMeToGroupStack.zms*.

```javascript
macroscript addMeToGroupStack (
	/** group id */ string groupId
) {

	var { result: {id : id , member: member } } = sudo zpRecipeUtils::GLOBAL_OWNER call zpRecipeGroup::addGroupMember({
		member: __userKey,
		id: groupId
	}) hardFail;

} return { id, member, groups }
```

`var { result : { id: id, member: member } }` tire profit du destructuring et permet d'extraire d'un objet seulement les champs qui nous intéressent.
N'hésitez pas à consulter [la page de Mozilla sur l'affectation par décomposition (ou destructuring)](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Op%C3%A9rateurs/Affecter_par_d%C3%A9composition).  

---
**Facultatif** : Pour pouvoir stocker des notes plus intéressantes, nous allons leur ajouter le login de l'auteur.

Créez un fichier *src/users/utils.zms* et copiez-collez y le code ci-dessous :

```javascript
/**
* var { result : { login: login }} = call getLogin();
* will give the login of the current user
*/
macroscript getLogin () {

	var keys = [__userKey];

	// using the service User Directory
	var { users } = users.userInfo({userKeys : keys});
	trace(users);
	var login = users[__userKey]['login'];

} return { login }
```
---

Trois macros vont nous être nécessaires : *listGroupStack*, *pushInGroupStack* et *removeFromGroupStack*. Pour plus de lisibilité définissez chacune des macros dans un fichier nommé comme la macro, et placez les dans le répertoire *src/groups/*.

```javascript

macroscript listGroupStack (
	/** group id */ string groupId
) {

	var { result: { group } } = sudo zpRecipeUtils::GLOBAL_OWNER call zpRecipeGroup::getGroup({id:groupId}) hardFail;

	var { result: { content: content }} = stacks.list({
		stack: group.name,
		owner: zpRecipeUtils::GLOBAL_OWNER
	});

} return { content }

-----

macroscript pushInGroupStack (
	/** group id */ string groupId,
	/** note content */ string note
) {

	var { result: { group } } = sudo zpRecipeUtils::GLOBAL_OWNER call zpRecipeGroup::getGroup({id:groupId}) hardFail;

	// retrieving current user login
	var { result : { login: login }} = call getLogin();

	// formating the note
	var noteData = {
		text: note,
		author: login,
		authorKey: __userKey,
		date: time:now()
	};

	var insertion = stacks.push({
		stack: group.name,
		owner: group.owner,
		data: noteData
	});

} return { group, insertion }

-----

macroscript removeFromGroupStack (
	/** group id */ string groupId,
	/** notes id removed */ array ids
) {

	var { result: { group } } = sudo zpRecipeUtils::GLOBAL_OWNER call zpRecipeGroup::getGroup({id:groupId}) hardFail;

	var suppression = stacks.remove({
		guids: ids,
		stack: group.name,
		owner: group.owner
	});

} return { group, suppression }

```

Notre API est fonctionnelle, il va maintenant falloir que l'utilisateur s'en serve. Pas besoin de créer de nouvelles macros, il suffit de modifier celles existantes.  

Placez-vous dans le fichier *src/users/notes.zms* :

```javascript

macroscript pushNote (string content = "Nothing") {

	// using the api GroupStack
	call pushInGroupStack({groupId : GROUP_DEFAULT_ID, note : content}) hardFail;

	var { result: { notes: notes } } = call getNotes() hardFail;

} broadcast { notes } on channel __selfName

macroscript getNotes () {

	var query = call listGroupStack({groupId : GROUP_DEFAULT_ID}) hardFail;
	var rawNotes = query.result.content;
	var notes = [];
	for note in rawNotes {
			var formated = {id: note.guid, text: note.data.text, author: note.data.author, authorKey: note.data.authorKey, date: note.data.date};
			notes = list:add(notes, formated);
	}

} broadcast { notes } on channel __selfName

macroscript deleteNotes (array ids) {

	call removeFromGroupStack({groupId : GROUP_DEFAULT_ID, ids : ids}) hardFail;

	var refresh = call getNotes() hardFail;
	var notes = refresh.result.notes;

} broadcast { notes } on channel __selfName
```

Dernières modifications côté serveur : à la création, ajouter le nouvel utilisateur au groupe global.

```javascript
// fichier src/users/create.zms
macroscript create (string login, string password) {

    // IMPORTANT : Remember, when executing this macro we are a weak user

	var user = auth.createUser({
		'login': login,
		'password': password
	});

	//  Registration of the new user to global group
	sudo user.zetapushKey call addMeToGroupStack({groupId: GROUP_DEFAULT_ID});

} return {user} on channel __selfName
```

Au démarrage du serveur, créé un groupe et un stack global, pour cela remplacer le contenu de *init.zms* par :

```javascript
// create the global group and assign it to global owner
sudo zpRecipeUtils::GLOBAL_OWNER call createGroupAndStack({
	groupName: GROUP_DEFAULT_NAME,
	groupId: GROUP_DEFAULT_ID
});
// with constants initialized in recipe.zms
```

**Déployer** les services puis les macros permet de rendre le backend fonctionnel.

## Côté Client ##

Rassurez-vous, les modifications à effectuer côté client tiennent en quelques lignes, la logique de celui-ci restant la même.

```javascript
// api/notes-api.service.ts
...
export interface Note {
    id: string,
    text: string,
    author: string,
    authorKey: string,
    date: number
}
...
```

```html
<!-- pages/home/home.html - à l'intérieur de ion-card -->
<ion-card-content no-padding>
    <ion-list>
        <ion-item text-wrap>
            <p><b>{{note.author}}</b><br/>{{note.text}}</p>
            <div item-end><i>{{note.date | date:'HH:mm:ss'}}</i></div>
            <ion-icon item-start [ngClass]="{notSelected: !isSelected(note)}" name="arrow-forward"></ion-icon>
        </ion-item>
    </ion-list>
</ion-card-content>
```

```css
/* pages/home/home.scss */
...

.faded {
    opacity: 0.2;
    /* no transition */
}

i {
    font-size: 80%;
    color: #488AFF;
}
```

Fini ! Cette partie permet de présenter de multiples aspects de ZetaPush, que ce soit l'import de recette, ou bien le système de permissions, d'utilisateurs, etc...
