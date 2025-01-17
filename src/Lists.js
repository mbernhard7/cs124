import {useEffect, useState} from "react";
import {generateUniqueID} from "web-vitals/dist/modules/lib/generateUniqueID";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import {useCollection} from "react-firebase-hooks/firestore";
import List from "./List";
import ErrorPopUp from "./ErrorPopUp";
import LoadingPopUp from "./LoadingPopUp";

const firebaseConfig = {
    apiKey: "AIzaSyDbDnRMAuOjcmsEB2iwcbt2_w6SPX-EAQo",
    authDomain: "cs124lab3.firebaseapp.com",
    projectId: "cs124lab3",
    storageBucket: "cs124lab3.appspot.com",
    messagingSenderId: "191143519167",
    appId: "1:191143519167:web:f33464f0d0ede5b538370a",
    measurementId: "G-B8CQHTFNQE"
};


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const listCollectionName = "lists";

function Lists(props) {
    const [currentListID, setCurrentListID] = useState(null);
    const query = db.collection(listCollectionName).where('sharedWith', 'array-contains', props.user.email);
    const [value, loading, error] = useCollection(query);
    const [lists, setLists] = useState([]);
    const [makingChanges, setMakingChanges] = useState(false);

    useEffect(() => {
        setLists(value?.docs.map(doc => doc.data()) || []);
    }, [value])

    useEffect(() => {
        if (currentListID === null && !makingChanges) {
            if (lists.length > 0) {
                setCurrentListID(lists[0].id);
            }
        }
    }, [currentListID, lists, makingChanges])

    async function onListAdded(listName) {
        setMakingChanges(true);
        const id = generateUniqueID();
        await db.collection(listCollectionName).doc(id).set({
            id: id,
            listName: listName,
            owner: props.user.email,
            sharedWith: [props.user.email],
        })
        setMakingChanges(false);
    }

    async function onListDeleted(id) {
        setMakingChanges(true);
        let oldCurrent = currentListID;
        setCurrentListID(null);
        const tasks = await db.collection(listCollectionName).doc(id).collection('tasks').get();
        await tasks.docs.forEach(doc => doc.ref.delete());
        await db.collection(listCollectionName).doc(id).delete();
        if (id !== oldCurrent) {
            setCurrentListID(oldCurrent);
        }
        setMakingChanges(false);
    }

    async function onListChanged(id, field, newValue) {
        setMakingChanges(true);
        if (id === currentListID && field === "sharedWith" && newValue.find(e => e === props.user.email) === undefined) {
            setCurrentListID(null);
        }
        await db.collection(listCollectionName).doc(id).update(
            {[field]: newValue}
        );
        setMakingChanges(false);
    }

    return <>
        <ErrorPopUp
            error={error}
        />
        {loading && <LoadingPopUp/>}
        <List
            lists={lists}
            user={props.user}
            auth={props.auth}
            db={db.collection(listCollectionName)}
            currentListID={currentListID}
            setCurrentListID={setCurrentListID}
            onListAdded={onListAdded}
            onListDeleted={onListDeleted}
            onListChanged={onListChanged}
        />
    </>
}

export default Lists