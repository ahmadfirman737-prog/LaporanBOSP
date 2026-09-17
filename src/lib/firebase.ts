import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
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
export const SYSTEM_COL = "system";

// Initialize and seed default data only once to prevent re-creating deleted records
export async function initializeFirestoreData() {
  try {
    const initDoc = await getDoc(doc(db, SYSTEM_COL, "initialized"));
    if (initDoc.exists()) {
      return;
    }

    // Check if any existing collection has documents
    const schoolSnap = await getDocs(collection(db, SCHOOL_COL));
    const honorSnap = await getDocs(collection(db, HONOR_COL));
    const siplahSnap = await getDocs(collection(db, SIPLAH_COL));

    if (!schoolSnap.empty || !honorSnap.empty || !siplahSnap.empty) {
      // Database already has data, just set initialized flag
      await setDoc(doc(db, SYSTEM_COL, "initialized"), {
        initializedAt: new Date().toISOString(),
      });
      return;
    }

    // First time setup: seed initial defaults
    const batch = writeBatch(db);
    batch.set(doc(db, SCHOOL_COL, "identitas"), initialSchoolData);

    for (const u of initialUsersList) {
      batch.set(doc(db, USERS_COL, u.id), u);
    }
    for (const g of initialGuruList) {
      batch.set(doc(db, GURU_COL, String(g.id)), g);
    }
    for (const h of initialHonorList) {
      batch.set(doc(db, HONOR_COL, String(h.id)), h);
    }
    for (const s of initialSiplahList) {
      batch.set(doc(db, SIPLAH_COL, String(s.id)), s);
    }
    batch.set(doc(db, SYSTEM_COL, "initialized"), {
      initializedAt: new Date().toISOString(),
    });

    await batch.commit();
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
      callback(list);
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
      list.sort((a, b) => a.id - b.id);
      callback(list);
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
      // Newest honor entries appear first
      list.sort((a, b) => b.id - a.id);
      callback(list);
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
      // Newest siplah transactions appear first
      list.sort((a, b) => b.id - a.id);
      callback(list);
    },
    (err) => console.error("Realtime siplah subscription error:", err)
  );
}

// REALTIME ATOMIC MUTATION HELPERS
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

export async function saveGuruToDb(guru: Guru) {
  try {
    await setDoc(doc(db, GURU_COL, String(guru.id)), guru);
  } catch (err) {
    console.error("Error saving guru to Firestore:", err);
  }
}

export async function deleteGuruFromDb(guruId: number) {
  try {
    await deleteDoc(doc(db, GURU_COL, String(guruId)));
  } catch (err) {
    console.error("Error deleting guru from Firestore:", err);
  }
}

export async function saveHonorToDb(entry: HonorEntry) {
  try {
    const cleanEntry: any = { ...entry };
    if (cleanEntry.tanggalPengembalian === undefined) {
      delete cleanEntry.tanggalPengembalian;
    }
    if (cleanEntry.jumlahDikembalikan === undefined) {
      cleanEntry.jumlahDikembalikan = 0;
    }
    await setDoc(doc(db, HONOR_COL, String(entry.id)), cleanEntry);
  } catch (err) {
    console.error("Error saving honor to Firestore:", err);
  }
}

export async function deleteHonorFromDb(honorId: number) {
  try {
    await deleteDoc(doc(db, HONOR_COL, String(honorId)));
  } catch (err) {
    console.error("Error deleting honor from Firestore:", err);
  }
}

export async function saveSiplahToDb(entry: SiplahEntry) {
  try {
    await setDoc(doc(db, SIPLAH_COL, String(entry.id)), entry);
  } catch (err) {
    console.error("Error saving siplah to Firestore:", err);
  }
}

export async function deleteSiplahFromDb(siplahId: number) {
  try {
    await deleteDoc(doc(db, SIPLAH_COL, String(siplahId)));
  } catch (err) {
    console.error("Error deleting siplah from Firestore:", err);
  }
}

export async function syncGuruListToDb(nextList: Guru[], prevList?: Guru[]) {
  try {
    if (prevList) {
      const nextIds = new Set(nextList.map((g) => g.id));
      for (const oldItem of prevList) {
        if (!nextIds.has(oldItem.id)) {
          await deleteDoc(doc(db, GURU_COL, String(oldItem.id)));
        }
      }
    }
    const prevMap = prevList ? new Map(prevList.map((g) => [g.id, g])) : new Map();
    for (const g of nextList) {
      const old = prevMap.get(g.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(g)) {
        await setDoc(doc(db, GURU_COL, String(g.id)), g);
      }
    }
  } catch (err) {
    console.error("Error syncing guru list to Firestore:", err);
  }
}

export async function syncHonorListToDb(nextList: HonorEntry[], prevList?: HonorEntry[]) {
  try {
    if (prevList) {
      const nextIds = new Set(nextList.map((h) => h.id));
      for (const oldItem of prevList) {
        if (!nextIds.has(oldItem.id)) {
          await deleteDoc(doc(db, HONOR_COL, String(oldItem.id)));
        }
      }
    }
    const prevMap = prevList ? new Map(prevList.map((h) => [h.id, h])) : new Map();
    for (const h of nextList) {
      const old = prevMap.get(h.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(h)) {
        await setDoc(doc(db, HONOR_COL, String(h.id)), h);
      }
    }
  } catch (err) {
    console.error("Error syncing honor list to Firestore:", err);
  }
}

export async function syncSiplahListToDb(nextList: SiplahEntry[], prevList?: SiplahEntry[]) {
  try {
    if (prevList) {
      const nextIds = new Set(nextList.map((s) => s.id));
      for (const oldItem of prevList) {
        if (!nextIds.has(oldItem.id)) {
          await deleteDoc(doc(db, SIPLAH_COL, String(oldItem.id)));
        }
      }
    }
    const prevMap = prevList ? new Map(prevList.map((s) => [s.id, s])) : new Map();
    for (const s of nextList) {
      const old = prevMap.get(s.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(s)) {
        await setDoc(doc(db, SIPLAH_COL, String(s.id)), s);
      }
    }
  } catch (err) {
    console.error("Error syncing siplah list to Firestore:", err);
  }
}
