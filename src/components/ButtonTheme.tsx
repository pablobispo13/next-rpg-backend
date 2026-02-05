import { useContext } from "react";
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ThemeContext } from "../context/ThemeContext";

//Context


export default function ButtonTheme() {
  const { mode, toggleColorMode } = useContext(ThemeContext);

  return <IconButton onClick={toggleColorMode} color="inherit">
    {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
  </IconButton>
}