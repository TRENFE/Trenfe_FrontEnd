import { define } from "../utils.ts";
import "../assets/styles.css";

export default define.page(function App({ Component }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Renfe_FrontEnd</title>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
});
