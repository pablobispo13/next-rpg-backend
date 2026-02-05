import { ReactNode } from "react";
import { AppBar, Toolbar, Button } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import ButtonTheme from "./ButtonTheme";
import { useRouter } from "next/router";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col">
      <AppBar position="static">
        <Toolbar>
          <Button variant="text" onClick={() => {
            router.push("/protected/")
          }} sx={{ flexGrow: 1 }}>
            RPG
          </Button>
          <ButtonTheme />
          {user && <Button color="inherit" onClick={() => logout}>Logout</Button>}
        </Toolbar>
      </AppBar>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
