import { useEffect, useState } from "preact/hooks";
import logo from "../assets/logo.png";

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(document.cookie.includes("bearer"));
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    document.cookie = "bearer=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    globalThis.location.href = "/";
  };

  if (isLoading) {
    return (
      <header>
        <div className="liquid-glass">
          <div className="button-group">
            <a href="/" className="headerbutton">Menu</a>
            <a href="/tickets" className="headerbutton">Billetes</a>
            <a href="/track" className="headerbutton">Seguimiento</a>
            <a href="/news" className="headerbutton">Noticias</a>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header>
      <div className="liquid-glass">
        <div className="button-group">
          <a href="/" className="headerbutton">
            <img src={logo} className="logo" />
          </a>
          <a href="/tickets" className="headerbutton">Billetes</a>
          <a href="/track" className="headerbutton">Seguimiento</a>
          <a href="/news" className="headerbutton">Noticias</a>
          {isAuthenticated
            ? (
              <>
                <a href="/profile" className="headerbutton">Mi Perfil</a>
                <button
                  className="headerbutton222"
                  onClick={handleLogout}
                  type="button"
                  style="border-radius:20px"
                >
                  Cerrar Sesion
                </button>
              </>
            )
            : (
              <>
                <a href="/login" className="headerbutton">Inicio Sesion</a>
                <a href="/register" className="headerbutton">Registro</a>
              </>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;
