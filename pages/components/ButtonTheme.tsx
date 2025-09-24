import { useContext } from "react";
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

//Context
import { ThemeContext } from "../../context/ThemeContext";

//Service
import { useTheme } from "@mui/material";

export default function ButtonTheme() {
  const themeMode = useContext(ThemeContext)
  const theme = useTheme()
  return <IconButton onClick={themeMode.toggleColorMode} color="inherit">
    {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
  </IconButton>
}