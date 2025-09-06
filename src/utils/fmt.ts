export const fmt = {
  pad(n: number) {
    return String(n).padStart(2, "0");
  },
  ms(ms: number) {
    const s = Math.floor(ms / 1000);
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return hh > 0 ? `${hh}:${fmt.pad(mm)}:${fmt.pad(ss)}` : `${mm}:${fmt.pad(ss)}`;
  },
  date(ts: number) {
    return new Date(ts).toLocaleString();
  },
};
