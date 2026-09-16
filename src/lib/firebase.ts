import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Firestore,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { SchoolData, AuthUser, Guru, HonorEntry, SiplahEntry } from "../types";
import {
  initialSchoolData,
  initialUsersList,
  initialGuruList,
  initialHonorList,
  initialSiplahList,
} from "../data/initialData";

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db: Firestore =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Collection Names
export const SCHOOL_COL = "schools";
export const USERS_COL = "users";
export const GURU_COL = "guru";
export const HONOR_COL = "honor";
export const SIPLAH_COL = "siplah";

// Initialize and seed default data if collections are empty
export async function initializeFirestoreData() {
  try {
    // 1. Seed School Data
    const schoolSnap = await getDocs(collection(db, SCHOOL_COL));
    if (schoolSnap.empty) {
      await setDoc(doc(db, SCHOOL_COL, "identitas"), initialSchoolData);
    }

    // 2. Seed Users
    const usersSnap = await getDocs(collection(db, USERS_COL));
    if (usersSnap.empty) {
      const batch = writeBatch(db);
      for (const u of initialUsersList) {
        batch.set(doc(db, USERS_COL, u.id), u);
      }
      await batch.commit();
    }

    // 3. Seed Guru
    const guruSnap = await getDocs(collection(db, GURU_COL));
    if (guruSnap.empty) {
      const batch = writeBatch(db);
      for (const g of initialGuruList) {
        batch.set(doc(db, GURU_COL, String(g.id)), g);
      }
      await batch.commit();
    }

    // 4. Seed Honor
    const honorSnap = await getDocs(collection(db, HONOR_COL));
    if (honorSnap.empty) {
      const batch = writeBatch(db);
      for (const h of initialHonorList) {
        batch.set(doc(db, HONOR_COL, String(h.id)), h);
      }
      await batch.commit();
    }

    // 5. Seed SIPLah
    const siplahSnap = await getDocs(collection(db, SIPLAH_COL));
    if (siplahSnap.empty) {
      const batch = writeBatch(db);
      for (const s of initialSiplahList) {
        batch.set(doc(db, SIPLAH_COL, String(s.id)), s);
      }
      await batch.commit();
    }
  } catch (err) {
    console.error("Error initializing Firestore seed data:", err);
  }
}

// REALTIME LISTENERS
export function subscribeSchool(callback: (data: SchoolData) => void) {
  return onSnapshot(
    doc(db, SCHOOL_COL, "identitas"),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SchoolData);
      }
    },
    (err) => console.error("Realtime school subscription error:", err)
  );
}

export function subscribeUsers(callback: (users: AuthUser[]) => void) {
  return onSnapshot(
    collection(db, USERS_COL),
    (snapshot) => {
      const list: AuthUser[] = [];
      snapshot.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as AuthUser);
      });
      if (list.length > 0) {
        callback(list);
      }
    },
    (err) => console.error("Realtime users subscription error:", err)
  );
}

export function subscribeGuru(callback: (guru: Guru[]) => void) {
  return onSnapshot(
    collection(db, GURU_COL),
    (snapshot) => {
      const list: Guru[] = [];
      snapshot.forEach((d) => {
        list.push({ ...d.data(), id: Number(d.id) } as Guru);
      });
      if (list.length > 0) {
        list.sort((a, b) => a.id - b.id);
        callback(list);
      }
    },
    (err) => console.error("Realtime guru subscription error:", err)
  );
}

export function subscribeHonor(callback: (honor: HonorEntry[]) => void) {
  return onSnapshot(
    collection(db, HONOR_COL),
    (snapshot) => {
      const list: HonorEntry[] = [];
      snapshot.forEach((d) => {
        list.push({ ...d.data(), id: Number(d.id) } as HonorEntry);
      });
      if (list.length > 0) {
        list.sort((a, b) => a.id - b.id);
        callback(list);
      }
    },
    (err) => console.error("Realtime honor subscription error:", err)
  );
}

export function subscribeSiplah(callback: (siplah: SiplahEntry[]) => void) {
  return onSnapshot(
    collection(db, SIPLAH_COL),
    (snapshot) => {
      const list: SiplahEntry[] = [];
      snapshot.forEach((d) => {
        list.push({ ...d.data(), id: Number(d.id) } as SiplahEntry);
      });
      if (list.length > 0) {
        list.sort((a, b) => a.id - b.id);
        callback(list);
      }
    },
    (err) => console.error("Realtime siplah subscription error:", err)
  );
}

// MUTATION HELPERS
export async function saveSchoolToDb(school: SchoolData) {
  try {
    await setDoc(doc(db, SCHOOL_COL, "identitas"), {
      ...school,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error saving school to Firestore:", err);
  }
}

export async function saveUserToDb(user: AuthUser) {
  try {
    await setDoc(doc(db, USERS_COL, user.id), user);
  } catch (err) {
    console.error("Error saving user to Firestore:", err);
  }
}

export async function deleteUserFromDb(userId: string) {
  try {
    await deleteDoc(doc(db, USERS_COL, userId));
  } catch (err) {
    console.error("Error deleting user from Firestore:", err);
  }
}

export async function syncGuruListToDb(nextList: Guru[], prevList?: Guru[]) {
  try {
    const batch = writeBatch(db);
    if (prevList) {
      const nextIds = new Set(nextList.map((g) => g.id));
      for (const oldItem of prevList) {
        if (!nextIds.has(oldItem.id)) {
          batch.delete(doc(db, GURU_COL, String(oldItem.id)));
        }
      }
    }
    for (const g of nextList) {
      batch.set(doc(db, GURU_COL, String(g.id)), g);
    }
    await batch.commit();
  } catch (err) {
    console.error("Error syncing guru list to Firestore:", err);
  }
}

export async function syncHonorListToDb(nextList: HonorEntry[], prevList?: HonorEntry[]) {
  try {
    const batch = writeBatch(db);
    if (prevList) {
      const nextIds = new Set(nextList.map((h) => h.id));
      for (const oldItem of prevList) {
        if (!nextIds.has(oldItem.id)) {
          batch.delete(doc(db, HONOR_COL, String(oldItem.id)));
        }
      }
    }
    for (const h of nextList) {
      batch.set(doc(db, HONOR_COL, String(h.id)), h);
    }
    await batch.commit();
  } catch (err) {
    console.error("Error syncing honor list to Firestore:", err);
  }
}

export async function syncSiplahListToDb(nextList: SiplahEntry[], prevList?: SiplahEntry[]) {
  try {
    const batch = writeBatch(db);
    if (prevList) {
      const nextIds = new Set(nextList.map((s) => s.id));
      for (const oldItem of prevList) {
        if (!nextIds.has(oldItem.id)) {
          batch.delete(doc(db, SIPLAH_COL, String(oldItem.id)));
        }
      }
    }
    for (const s of nextList) {
      batch.set(doc(db, SIPLAH_COL, String(s.id)), s);
    }
    await batch.commit();
  } catch (err) {
    console.error("Error syncing siplah list to Firestore:", err);
  }
}
