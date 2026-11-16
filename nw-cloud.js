// Nine & Weird Supabase authentication (public client configuration only).
// The publishable key is designed to be public. Never add a secret/service-role key here.
(function(){
  'use strict';
  const endpoint='https://jppbxspcnqagsrqvstqf.supabase.co';
  const publishable='sb_publishable_P80z-hJkq1hjRIZOP1iIPA_XZwuD9PU';
  const turnstileSiteKey='0x4AAAAAAGDxLEVgi4-bx78d'; // Public Site Key; never put a Secret Key here.
  let turnstileWidget=null, turnstileToken='', turnstileContainer=null, mountTimer=null;
  function clearCaptcha(){
    if(mountTimer){clearTimeout(mountTimer);mountTimer=null;}
    if(turnstileWidget!==null && window.turnstile){try{window.turnstile.remove(turnstileWidget)}catch(e){console.warn('Turnstile cleanup',e)}}
    turnstileWidget=null;turnstileToken='';turnstileContainer=null;
  }
  function mountCaptcha(container){
    clearCaptcha();turnstileContainer=container;
    const hint=container.querySelector('.nw-captcha-status');
    let tries=0;
    function attempt(){
      if(!container.isConnected)return;
      if(window.turnstile && typeof window.turnstile.render==='function'){
        try{
          turnstileWidget=window.turnstile.render(container.querySelector('.nw-captcha-widget'),{
            sitekey:turnstileSiteKey,theme:'dark',appearance:'always',
            callback:(token)=>{turnstileToken=token;if(hint)hint.textContent='Security check complete.'},
            'expired-callback':()=>{turnstileToken='';if(hint)hint.textContent='Security check expired. Complete it again.'},
            'error-callback':()=>{turnstileToken='';if(hint)hint.textContent='Security check failed. Please retry.'}
          });
          if(hint)hint.textContent='Complete the security check before signing in or creating a guest account.';
        }catch(e){if(hint)hint.textContent='Security check unavailable. Please refresh.';console.warn('Turnstile render',e)}
        return;
      }
      if(++tries<60)mountTimer=setTimeout(attempt,250);
      else if(hint)hint.textContent='Security check failed to load. Check connection and refresh.';
    }
    attempt();
  }
  function captchaToken(){
    const token=window.turnstile && turnstileWidget!==null ? window.turnstile.getResponse(turnstileWidget) : turnstileToken;
    if(!token)throw new Error('Please complete the security check before continuing.');
    return token;
  }
  function resetCaptcha(){
    turnstileToken='';if(turnstileWidget!==null&&window.turnstile){try{window.turnstile.reset(turnstileWidget)}catch(e){console.warn('Turnstile reset',e)}}
    const hint=turnstileContainer?.querySelector('.nw-captcha-status');if(hint)hint.textContent='Complete the security check again for another attempt.';
  }
  let client=null, user=null, recovering=false;
  let listeners=[];
  const emit=()=>listeners.forEach(fn=>{try{fn(user)}catch(e){console.warn('NW auth listener',e)}});
  const ready=(async()=>{
    if(!window.supabase || !window.supabase.createClient){throw new Error('Supabase library could not load. Check your network connection.')}
    client=window.supabase.createClient(endpoint,publishable,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data,error}=await client.auth.getUser();
    if(error && !/session missing/i.test(error.message||''))console.warn('NW auth start',error.message);
    user=data?.user||null;emit();
    client.auth.onAuthStateChange((event,session)=>{user=session?.user||null;if(event==='PASSWORD_RECOVERY')recovering=true;emit();});
    return client;
  })();
  async function get(){return await ready;}
  async function invoke(method,params){const c=await get();const res=await c.auth[method](params);if(res.error)throw new Error(res.error.message);return res.data;}
  window.nwCloud={ready,get,mountCaptcha,clearCaptcha,captchaToken,resetCaptcha,user:()=>user,isRecovering:()=>recovering,finishRecovery:async(password)=>{const c=await get();const {error}=await c.auth.updateUser({password});if(error)throw new Error(error.message);recovering=false;emit();},onChange:(fn)=>{listeners.push(fn);return ()=>listeners=listeners.filter(x=>x!==fn)},
    signInAnonymously:()=>invoke('signInAnonymously',{options:{captchaToken:captchaToken()}}),
    signUp:(email,password)=>invoke('signUp',{email,password,options:{emailRedirectTo:location.origin+location.pathname,captchaToken:captchaToken()}}),
    signIn:(email,password)=>invoke('signInWithPassword',{email,password,options:{captchaToken:captchaToken()}}),
    signOut:()=>invoke('signOut'),
    resetPassword:(email)=>invoke('resetPasswordForEmail',{email,redirectTo:location.origin+location.pathname,captchaToken:captchaToken()}),
    async readProfile(){const c=await get();if(!user)return null;const {data,error}=await c.from('nw_profiles').select('display_name,avatar').eq('user_id',user.id).maybeSingle();if(error)throw new Error(error.message);return data;},
    async saveProfile(name,avatar){const c=await get();if(!user)throw new Error('Please sign in first.');const {error}=await c.from('nw_profiles').update({display_name:name,avatar,updated_at:new Date().toISOString()}).eq('user_id',user.id);if(error)throw new Error(error.message);}
  };
})();
