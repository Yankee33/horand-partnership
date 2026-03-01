import React, { createContext, useContext, useState } from "react";
import { UserOut } from "../api/Api";

export interface CoOwner {
  id: number;
  name: string;
  share: string;
  photo: File | null;
  // після збереження на сервері:
  serverId?: number;
  photoUrl?: string;
}

export interface IncomeRule {
  ownerId: number;
  share: string;
}

export interface IncomeDistributionData {
  type: "company" | "project";
  projectName: string;
  coOwners: CoOwner[];
}

export interface IncomeTypesData {
  project: IncomeRule[];
  clients: IncomeRule[];
  profit: IncomeRule[];
}

interface AppState {
  distribution: IncomeDistributionData;
  incomeTypes: IncomeTypesData;
  contractConfirmed: boolean;
  companyId: number | null;
  currentUser: UserOut | null;
  setDistribution: (data: IncomeDistributionData) => void;
  setIncomeTypes: (data: IncomeTypesData) => void;
  setContractConfirmed: (v: boolean) => void;
  setCompanyId: (id: number | null) => void;
  setCurrentUser: (user: UserOut | null) => void;
}

const defaultDistribution: IncomeDistributionData = {
  type: "company",
  projectName: "",
  coOwners: [
    { id: 1, name: "", share: "", photo: null },
    { id: 2, name: "", share: "", photo: null },
  ],
};

const defaultIncomeTypes: IncomeTypesData = {
  project: [],
  clients: [],
  profit: [],
};

const AppContext = createContext<AppState>({
  distribution: defaultDistribution,
  incomeTypes: defaultIncomeTypes,
  contractConfirmed: false,
  companyId: null,
  currentUser: null,
  setDistribution: () => {},  // ці функції з типом як зміна стану
  setIncomeTypes: () => {},
  setContractConfirmed: () => {},
  setCompanyId: () => {},
  setCurrentUser: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [distribution, setDistribution] = useState<IncomeDistributionData>(defaultDistribution);
  const [incomeTypes, setIncomeTypes] = useState<IncomeTypesData>(defaultIncomeTypes);
  const [contractConfirmed, setContractConfirmed] = useState(false);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<UserOut | null>(null);

  return (
    <AppContext.Provider value={{
      distribution, incomeTypes, contractConfirmed, companyId, currentUser,
      setDistribution, setIncomeTypes, setContractConfirmed, setCompanyId, setCurrentUser,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);