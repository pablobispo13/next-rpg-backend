import { ReactNode } from "react";
import { AppBar, Toolbar, Button } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import ButtonTheme from "./ButtonTheme";
import { useRouter } from "next/router";
import { DiceInputRoller } from "./DiceInputRoller";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col">
      <AppBar position="static">
        <Toolbar sx={{ display: "flex", justifyContent: "flex-end" }}>
          {user && <Button color="inherit" onClick={() => logout("manual")}>Logout</Button>}
        </Toolbar>
      </AppBar>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
