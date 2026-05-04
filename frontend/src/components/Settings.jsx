import { usePreference } from "../contexts/PreferenceContext";

export default function Settings() {
  const { theme, toggleTheme, fontSize, changeFontSize } = usePreference();

  return (
    <div>
      <h2>Settings</h2>

      <button onClick={toggleTheme}>
        Current: {theme}
      </button>

      <div>
        <button onClick={() => changeFontSize(14)}>Small</button>
        <button onClick={() => changeFontSize(16)}>Medium</button>
        <button onClick={() => changeFontSize(18)}>Large</button>
      </div>
    </div>
  );
}