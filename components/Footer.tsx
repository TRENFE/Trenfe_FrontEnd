import ChatWidgetIsland from "../islands/ChatWidgetIsland.tsx";

const Footer = () => {
  return (
    <>
      <footer>
        <div class="liquid-glass">
          <p>
            &#169;{new Date().getFullYear()} TRENFE. Desarollado por Sergio Martin.
            Demo
          </p>
        </div>
      </footer>
      <ChatWidgetIsland />
    </>
  );
};

export default Footer;
