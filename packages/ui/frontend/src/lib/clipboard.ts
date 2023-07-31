export function copyTextData(data: string) {
  const el = document.createElement('textarea');
  el.value = data;
  el.style.position = 'fixed';
  el.style.left = '-9999px';
  el.style.top = '-9999px';
  el.style.width = '1px';
  el.style.height = '1px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}
