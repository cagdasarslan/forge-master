// Bulut: Supabase ile hesap, kayıt yedeği ve sıralama.
//
// İlk açılışta görünmez bir misafir hesabı açılır; ilerleme her dakika ve uygulama arka plana geçince buluta yazılır.
// Oyuncu Google hesabını bağlarsa oyunu silip kursa ya da telefon değiştirse de Google ile girip kaydını geri alır.
// Tablolar ve fonksiyonlar: supabase/schema.sql
import { Capacitor } from '@capacitor/core';
import { SUPABASE_URL, SUPABASE_KEY, GOOGLE_WEB_CLIENT_ID } from './cloud-config.js';
import { computePower } from './power.js';

const SYNC_EVERY = 45000;
const RELOAD_FLAG = 'forgemaster.cloudReload';

// takma adda engellenen kelimeler (küçük harfle, kelime içinde de aranır)
const BAD = ['amk', 'orospu', 'piç', 'yarrak', 'ibne', 'kahpe', 'pezevenk', 'gavat', 'sikik', 'siktir', 'amcık', 'fuck', 'shit', 'bitch', 'cunt', 'nigg', 'whore', 'slut', 'porn', 'nazi', 'hitler', 'admin', 'moderator'];

class Cloud {
  constructor() {
    this.enabled = !!(SUPABASE_URL && SUPABASE_KEY);
    this.sb = null;
    this.user = null;
    this.nickname = null;
    this.state = this.enabled ? 'connecting' : 'off'; // off | connecting | ok | offline
    this.lastRev = -1;
    this.profile = null;
    this.onConflict = null;   // (remote) => Promise<'remote'|'local'>  ui verir
    this.onChange = null;     // hesap durumu değişince (ayarlar ekranı yenilensin)
    this.googleReady = false;
  }

  get canGoogle() { return this.enabled && !!GOOGLE_WEB_CLIENT_ID && Capacitor.getPlatform() === 'android'; }
  get isGuest() { return !this.user || this.user.is_anonymous; }
  get googleEmail() {
    const id = this.user?.identities?.find((i) => i.provider === 'google');
    return id ? id.identity_data?.email || this.user.email || 'Google' : null;
  }
  get playerId() { return this.user?.id?.slice(0, 8).toUpperCase() || ''; }

  // ---------- başlatma ----------
  async init(profile) {
    this.profile = profile;
    if (!this.enabled) return;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      this.sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      });
      await this.ensureUser();
      await this.pull();
    } catch (e) {
      console.warn('cloud init', e);
      this.state = 'offline';
    }
    setInterval(() => this.sync(), SYNC_EVERY);
    this.changed();
  }

  async ensureUser() {
    const { data } = await this.sb.auth.getSession();
    let user = data.session?.user;
    if (!user) {
      const r = await this.sb.auth.signInAnonymously();
      if (r.error) throw r.error;
      user = r.data.user;
    }
    this.user = user;
    this.state = 'ok';
  }

  // Sunucudaki kayıt bu cihazdakinden yeniyse onu yükler (sayfa yenilenir), değilse bu cihazdakini gönderir
  async pull() {
    const remote = await this.rpc('load_player');
    this.nickname = remote?.nickname || null;
    const d = this.profile.data;
    if (remote?.save && remote.rev > (d.rev || 0) && !sessionStorage.getItem(RELOAD_FLAG)) {
      this.applyRemote(remote);
      return;
    }
    sessionStorage.removeItem(RELOAD_FLAG);
    d.uid = this.user.id;
    await this.sync(true);
  }

  applyRemote(remote) {
    const save = { ...remote.save, rev: remote.rev, uid: this.user.id };
    this.profile.replaceData(save);
    sessionStorage.setItem(RELOAD_FLAG, '1');
    location.reload();
  }

  async rpc(fn, args) {
    const { data, error } = await this.sb.rpc(fn, args);
    if (error) throw error;
    return data;
  }

  // ---------- kayıt yedeği ----------
  async sync(force = false) {
    if (!this.sb || !this.user || this.syncing) return;
    const d = this.profile.data;
    if (!force && d.rev === this.lastRev) return;
    this.syncing = true;
    try {
      if (this.state === 'offline') await this.ensureUser();
      d.uid = this.user.id;
      const r = await this.rpc('sync_player', { p_save: d, p_rev: d.rev || 0, p_power: computePower(this.profile) });
      if (r?.ok) this.lastRev = d.rev;
      else await this.resolveConflict(r.rev);
      this.state = 'ok';
    } catch (e) {
      console.warn('cloud sync', e);
      this.state = 'offline';
    } finally {
      this.syncing = false;
    }
  }

  // Sunucuda daha yeni kayıt var (başka cihazda oynanmış ya da ilerleme sıfırlanmış)
  async resolveConflict(remoteRev) {
    const remote = await this.rpc('load_player');
    const d = this.profile.data;
    const keepLocal = () => { d.rev = remoteRev + 1; this.profile.save(); };
    if (!remote?.save) { keepLocal(); return this.sync(true); }
    const choice = this.onConflict ? await this.onConflict(remote) : 'remote';
    if (choice === 'remote') this.applyRemote(remote);
    else { keepLocal(); await this.sync(true); }
  }

  // İlerlemeyi sıfırlarken buluttaki kaydı da boşalt (yoksa açılışta geri yüklenir)
  async wipeSave() {
    if (!this.sb || !this.user) return;
    try {
      const remote = await this.rpc('load_player');
      await this.rpc('sync_player', { p_save: null, p_rev: Math.max(remote?.rev || 0, this.profile.data.rev || 0) + 1, p_power: 0 });
    } catch (e) { console.warn('cloud wipe', e); }
  }

  // ---------- takma ad ve sıralama ----------
  static badName(n) {
    const s = n.toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]/g, '');
    return BAD.some((w) => s.includes(w));
  }

  async setNickname(n) {
    const v = n.trim().replace(/\s+/g, ' ');
    if (v.length < 3 || v.length > 16 || !/^[\p{L}\p{N} _.-]+$/u.test(v)) return 'invalid';
    if (Cloud.badName(v)) return 'bad';
    const r = await this.rpc('set_nickname', { n: v });
    if (r === 'ok') { this.nickname = v; this.changed(); }
    return r;
  }

  // p: 'week' | 'month' | 'year' | 'all'
  async leaderboard(p) {
    await this.sync(true);
    const [rows, me] = await Promise.all([this.rpc('leaderboard', { p, lim: 50 }), this.rpc('my_rank', { p })]);
    return { rows: rows || [], me: me?.[0] || null };
  }

  // ---------- Google ----------
  async googleToken() {
    const { SocialLogin } = await import('@capgo/capacitor-social-login');
    if (!this.googleReady) {
      await SocialLogin.initialize({ google: { webClientId: GOOGLE_WEB_CLIENT_ID, mode: 'online' } });
      this.googleReady = true;
    }
    // Supabase, kimlik belirtecindeki nonce'un ham halini ister; Google'a SHA-256 özeti gider
    const raw = crypto.getRandomValues(new Uint8Array(16)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)))]
      .map((b) => b.toString(16).padStart(2, '0')).join('');
    // e-posta ve profil varsayılan; ek kapsam (scopes) istemek MainActivity değişikliği ister
    const res = await SocialLogin.login({ provider: 'google', options: { nonce: hash } });
    const token = res?.result?.idToken;
    if (!token) throw new Error('no id token');
    return { token, nonce: raw };
  }

  // Misafir hesabına Google bağlar. Bu Google hesabının zaten bir krallığı varsa { existing: true } döner.
  async linkGoogle() {
    const t = await this.googleToken();
    const { data, error } = await this.sb.auth.linkIdentity({ provider: 'google', token: t.token, nonce: t.nonce });
    if (!error) {
      this.user = data.user || (await this.sb.auth.getUser()).data.user;
      this.changed();
      return { linked: true };
    }
    if (/already|exists|identity/i.test(error.message || '') || error.code === 'identity_already_exists') return { existing: true };
    throw error;
  }

  // Google hesabındaki krallığa geç: bu cihazdaki misafir ilerlemesi bırakılır, buluttaki yüklenir
  async switchToGoogle() {
    const t = await this.googleToken();
    const { data, error } = await this.sb.auth.signInWithIdToken({ provider: 'google', token: t.token, nonce: t.nonce });
    if (error) throw error;
    this.user = data.user;
    const remote = await this.rpc('load_player');
    if (remote?.save) this.applyRemote(remote);
    else { this.profile.data.uid = this.user.id; await this.sync(true); this.changed(); }
  }

  // ---------- hesap silme (Google Play şartı) ----------
  async deleteAccount() {
    await this.rpc('delete_account');
    try { await this.sb.auth.signOut({ scope: 'local' }); } catch { /* hesap zaten silindi */ }
  }

  changed() { this.onChange?.(); }
}

export const cloud = new Cloud();
export { Cloud };
