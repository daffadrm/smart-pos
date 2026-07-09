// Prints only the DOM subtree marked with the `.print-area` class (see globals.css).
export function printOnly() {
  if (typeof document === "undefined") return;
  document.body.classList.add("printing-target");

  function cleanup() {
    document.body.classList.remove("printing-target");
    window.removeEventListener("afterprint", cleanup);
  }
  window.addEventListener("afterprint", cleanup);

  window.print();
}
