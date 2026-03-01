import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { HomePage } from "./components/HomePage/HomePage";
import { LoginPage } from "./components/LoginPage/LoginPage";
import { RegisterPage } from "./components/RegisterPage/RegisterPage";
import { IncomeDistribution } from "./components/IncomeDistribution/IncomeDistribution";
import { IncomeTypes } from "./components/IncomeTypes/IncomeTypes";
import { SummaryPage } from "./components/SummaryPage/SummaryPage";
import { ContractPage } from "./components/ContractPage/ContractPage";
import "./i18n/i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/distribution" element={<IncomeDistribution />} />
          <Route path="/income-types" element={<IncomeTypes />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/contract" element={<ContractPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  </React.StrictMode>
);