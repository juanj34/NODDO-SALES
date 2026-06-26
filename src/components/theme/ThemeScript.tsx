/**
 * Blocking inline script rendered in <head> BEFORE paint.
 * The server already applies the cookie theme to <html data-theme>; this script
 * only runs on the FIRST visit (no cookie) to pick the OS preference, so there is
 * no flash of the wrong theme. Keep it dependency-free and tiny.
 */
export function ThemeScript() {
  const js = `(function(){try{
    if(/(?:^|; )noddo-theme=/.test(document.cookie))return;
    var t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)?'light':'dark';
    document.documentElement.setAttribute('data-theme',t);
    document.cookie='noddo-theme='+t+'; path=/; max-age=31536000; samesite=lax';
  }catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
