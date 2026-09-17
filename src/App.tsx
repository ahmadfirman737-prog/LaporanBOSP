import React, { useState, useEffect, useMemo } from "react";
import {
  initialSchoolData,
  initialGuruList,
  initialHonorList,
  initialSiplahList,
  initialUsersList,
} from "./data/initialData";
import {
  SchoolData,
  Guru,
  HonorEntry,
  SiplahEntry,
  TabType,
  ToastNotification,
  AuthUser,
} from "./types";
import { Sidebar } from "./components/Sidebar";
import { HeaderBar } from "./components/HeaderBar";
import { DashboardView } from "./components/DashboardView";
import { HonorView } from "./components/HonorView";
import { SiplahView } from "./components/SiplahView";
import { LaporanView } from "./components/LaporanView";
import { LaporanHonorView } from "./components/LaporanHonorView";
import { LaporanSiplahView } from "./components/LaporanSiplahView";
import { LaporanPengembalianView } from "./components/LaporanPengembalianView";
import { GuruView } from "./components/GuruView";
import { PengaturanView } from "./components/PengaturanView";
import { UserManagementView } from "./components/UserManagementView";
import { LoginView } from "./components/LoginView";
import { Toast } from "./components/Toast";
import {
  initializeFirestoreData,
  subscribeSchool,
  subscribeUsers,
  subscribeGuru,
  subscribeHonor,
  subscribeSiplah,
  saveSchoolToDb,
  saveUserToDb,
  deleteUserFromDb,
  syncGuruListToDb,
  syncHonorListToDb,
  syncSiplahListToDb,
} from "./lib/firebase";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Persistent State with localStorage & Firebase Realtime
  const [school, setSchool] = useState<SchoolData>(() => {
    try {
      const saved = localStorage.getItem("bosp_school_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically migrate to new official Kusuma Bangsa logo
        if (!parsed.logoUrl || parsed.logoUrl.includes("unsplash.com") || parsed.logoUrl === "/logo.svg") {
          parsed.logoUrl = "/logo.svg?v=kusuma2";
        }
        if (parsed.namaSekolah === "SD NEGERI HARAPAN BANGSA 01") {
          parsed.namaSekolah = "YAYASAN PENDIDIKAN KUSUMA BANGSA BOGOR";
          parsed.alamatSekolah = "Jl. Pendidikan No. 45, Kota Bogor, Jawa Barat";
        }
        return parsed;
      }
      return initialSchoolData;
    } catch {
      return initialSchoolData;
    }
  });

  // Current authenticated user state
  const defaultUser: AuthUser = useMemo(
    () => ({
      id: "usr-1",
      username: "bendahara",
      nama: school.bendahara || "Siti Rahmawati, S.E.",
      role: "Bendahara BOSP",
      nip: school.nipBendahara || "19850722 201001 2 015",
      email: "bendahara@kusumabangsa.sch.id",
    }),
    [school.bendahara, school.nipBendahara]
  );

  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    try {
      const saved = localStorage.getItem("bosp_auth_user");
      return saved ? JSON.parse(saved) : defaultUser;
    } catch {
      return defaultUser;
    }
  });

  // Login status state: Always require login when accessing via link or starting a session
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      // Clear legacy localStorage auto-login so opening the link directly goes to login
      localStorage.removeItem("bosp_is_logged_in");
      const sessionSaved = sessionStorage.getItem("bosp_is_logged_in");
      return sessionSaved === "true";
    } catch {
      return false;
    }
  });

  const [guruList, setGuruList] = useState<Guru[]>(() => {
    try {
      const saved = localStorage.getItem("bosp_guru_list");
      return saved ? JSON.parse(saved) : initialGuruList;
    } catch {
      return initialGuruList;
    }
  });

  const [honorList, setHonorList] = useState<HonorEntry[]>(() => {
    try {
      const saved = localStorage.getItem("bosp_honor_list");
      return saved ? JSON.parse(saved) : initialHonorList;
    } catch {
      return initialHonorList;
    }
  });

  const [siplahList, setSiplahList] = useState<SiplahEntry[]>(() => {
    try {
      const saved = localStorage.getItem("bosp_siplah_list");
      return saved ? JSON.parse(saved) : initialSiplahList;
    } catch {
      return initialSiplahList;
    }
  });

  const [usersList, setUsersList] = useState<AuthUser[]>(() => {
    try {
      const saved = localStorage.getItem("bosp_users_list");
      return saved ? JSON.parse(saved) : initialUsersList;
    } catch {
      return initialUsersList;
    }
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("bosp_school_data", JSON.stringify(school));
    } catch (e) {
      console.error(e);
    }
  }, [school]);

  useEffect(() => {
    try {
      localStorage.setItem("bosp_users_list", JSON.stringify(usersList));
    } catch (e) {
      console.error(e);
    }
  }, [usersList]);

  useEffect(() => {
    try {
      localStorage.setItem("bosp_guru_list", JSON.stringify(guruList));
    } catch (e) {
      console.error(e);
    }
  }, [guruList]);

  useEffect(() => {
    try {
      localStorage.setItem("bosp_honor_list", JSON.stringify(honorList));
    } catch (e) {
      console.error(e);
    }
  }, [honorList]);

  useEffect(() => {
    try {
      localStorage.setItem("bosp_siplah_list", JSON.stringify(siplahList));
    } catch (e) {
      console.error(e);
    }
  }, [siplahList]);

  // Real-time Cloud Synchronization via Firebase Firestore
  useEffect(() => {
    // 1. Seed initial data to Firestore if empty
    initializeFirestoreData()
      .then(() => {
        setIsFirebaseConnected(true);
      })
      .catch((err) => {
        console.error("Firestore init error:", err);
        setIsFirebaseConnected(false);
      });

    // 2. Real-time Subscriptions
    const unsubSchool = subscribeSchool((remoteSchool) => {
      if (remoteSchool) {
        setSchool((prev) => ({ ...prev, ...remoteSchool }));
      }
    });

    const unsubUsers = subscribeUsers((remoteUsers) => {
      if (remoteUsers) {
        setUsersList(remoteUsers);
      }
    });

    const unsubGuru = subscribeGuru((remoteGuru) => {
      if (remoteGuru) {
        setGuruList(remoteGuru);
      }
    });

    const unsubHonor = subscribeHonor((remoteHonor) => {
      if (remoteHonor) {
        setHonorList(remoteHonor);
      }
    });

    const unsubSiplah = subscribeSiplah((remoteSiplah) => {
      if (remoteSiplah) {
        setSiplahList(remoteSiplah);
      }
    });

    return () => {
      unsubSchool();
      unsubUsers();
      unsubGuru();
      unsubHonor();
      unsubSiplah();
    };
  }, []);

  // Handlers for Firestore-synced state updates
  const handleSetSchool: React.Dispatch<React.SetStateAction<SchoolData>> = (action) => {
    setSchool((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveSchoolToDb(next);
      return next;
    });
  };

  const handleSetGuruList: React.Dispatch<React.SetStateAction<Guru[]>> = (action) => {
    setGuruList((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      syncGuruListToDb(next, prev);
      return next;
    });
  };

  const handleSetHonorList: React.Dispatch<React.SetStateAction<HonorEntry[]>> = (action) => {
    setHonorList((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      syncHonorListToDb(next, prev);
      return next;
    });
  };

  const handleSetSiplahList: React.Dispatch<React.SetStateAction<SiplahEntry[]>> = (action) => {
    setSiplahList((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      syncSiplahListToDb(next, prev);
      return next;
    });
  };

  // Toast Helper
  const showToast = (
    message: string,
    type: "success" | "info" | "warning" | "error" = "success"
  ) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const handleDismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Financial Calculations
  const totalHonorGaji = useMemo(() => {
    return honorList.reduce((sum, item) => sum + (Number(item.gaji) || 0), 0);
  }, [honorList]);

  const totalHonorSI = useMemo(() => {
    return honorList.reduce((sum, item) => sum + (Number(item.jumlahSI) || 0), 0);
  }, [honorList]);

  const totalHonorKembali = useMemo(() => {
    return honorList.reduce((sum, item) => {
      const diff = (Number(item.jumlahSI) || 0) - (Number(item.gaji) || 0);
      return sum + (diff > 0 ? diff : 0);
    }, 0);
  }, [honorList]);

  const totalSIPLahNominal = useMemo(() => {
    return siplahList.reduce((sum, item) => sum + (Number(item.jumlahSIPLah) || 0), 0);
  }, [siplahList]);

  const totalSIPLahSI = useMemo(() => {
    return siplahList.reduce((sum, item) => sum + (Number(item.jumlahSI) || 0), 0);
  }, [siplahList]);

  const totalSIPLahKembali = useMemo(() => {
    return siplahList.reduce((sum, item) => {
      const diff = (Number(item.jumlahSI) || 0) - (Number(item.jumlahSIPLah) || 0);
      return sum + (diff > 0 ? diff : 0);
    }, 0);
  }, [siplahList]);

  const grandTotalPengembalian = useMemo(() => {
    return totalHonorKembali + totalSIPLahKembali;
  }, [totalHonorKembali, totalSIPLahKembali]);

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    try {
      localStorage.setItem("bosp_auth_user", JSON.stringify(user));
      sessionStorage.setItem("bosp_is_logged_in", "true");
      localStorage.removeItem("bosp_is_logged_in");
    } catch (e) {
      console.error(e);
    }
    showToast(`Selamat datang, ${user.nama} (${user.role})!`, "success");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    try {
      sessionStorage.removeItem("bosp_is_logged_in");
      localStorage.removeItem("bosp_is_logged_in");
    } catch (e) {
      console.error(e);
    }
    showToast("Anda telah keluar dari aplikasi BOSP.", "info");
  };

  const handleAddUser = (newUser: AuthUser) => {
    setUsersList((prev) => [newUser, ...prev]);
    saveUserToDb(newUser);
  };

  const handleUpdateUser = (updatedUser: AuthUser) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    saveUserToDb(updatedUser);
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem("bosp_auth_user", JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsersList((prev) => prev.filter((u) => u.id !== userId));
    deleteUserFromDb(userId);
  };

  const handleChangePassword = (userId: string, newPass: string) => {
    setUsersList((prev) => {
      const updatedList = prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, password: newPass };
          saveUserToDb(updated);
          return updated;
        }
        return u;
      });
      return updatedList;
    });
    if (currentUser.id === userId) {
      const updated = { ...currentUser, password: newPass };
      setCurrentUser(updated);
      localStorage.setItem("bosp_auth_user", JSON.stringify(updated));
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <Toast toasts={toasts} onDismiss={handleDismissToast} />
        <LoginView school={school} users={usersList} onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800 antialiased font-sans">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Responsive Left Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        school={school}
        honorCount={honorList.length}
        siplahCount={siplahList.length}
        guruCount={guruList.length}
        userCount={usersList.length}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <HeaderBar
          school={school}
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigateTab={setActiveTab}
          firebaseConnected={isFirebaseConnected}
        />

        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === "dashboard" && (
            <DashboardView
              school={school}
              totalHonorGaji={totalHonorGaji}
              totalHonorSI={totalHonorSI}
              totalHonorKembali={totalHonorKembali}
              totalSIPLahNominal={totalSIPLahNominal}
              totalSIPLahSI={totalSIPLahSI}
              totalSIPLahKembali={totalSIPLahKembali}
              grandTotalPengembalian={grandTotalPengembalian}
              honorList={honorList}
              siplahList={siplahList}
              guruList={guruList}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "honor" && (
            <HonorView
              honorList={honorList}
              setHonorList={handleSetHonorList}
              guruList={guruList}
              showToast={showToast}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === "siplah" && (
            <SiplahView
              siplahList={siplahList}
              setSiplahList={handleSetSiplahList}
              showToast={showToast}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === "laporan-honor" && (
            <LaporanHonorView
              school={school}
              honorList={honorList}
              guruList={guruList}
              onNavigateTab={setActiveTab}
              showToast={showToast}
            />
          )}

          {activeTab === "laporan-siplah" && (
            <LaporanSiplahView
              school={school}
              siplahList={siplahList}
              onNavigateTab={setActiveTab}
              showToast={showToast}
            />
          )}

          {activeTab === "laporan-pengembalian" && (
            <LaporanPengembalianView
              school={school}
              honorList={honorList}
              siplahList={siplahList}
              guruList={guruList}
              onNavigateTab={setActiveTab}
              showToast={showToast}
            />
          )}

          {activeTab === "laporan" && (
            <LaporanView
              school={school}
              honorList={honorList}
              siplahList={siplahList}
              guruList={guruList}
              totalHonorGaji={totalHonorGaji}
              totalHonorSI={totalHonorSI}
              totalHonorKembali={totalHonorKembali}
              totalSIPLahNominal={totalSIPLahNominal}
              totalSIPLahSI={totalSIPLahSI}
              totalSIPLahKembali={totalSIPLahKembali}
              grandTotalPengembalian={grandTotalPengembalian}
              onNavigateTab={setActiveTab}
              showToast={showToast}
            />
          )}

          {activeTab === "guru" && (
            <GuruView
              guruList={guruList}
              setGuruList={handleSetGuruList}
              showToast={showToast}
            />
          )}

          {activeTab === "users" && (
            <UserManagementView
              users={usersList}
              currentUser={currentUser}
              school={school}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onChangePassword={handleChangePassword}
              showToast={showToast}
            />
          )}

          {activeTab === "pengaturan" && (
            <PengaturanView
              school={school}
              setSchool={handleSetSchool}
              showToast={showToast}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
