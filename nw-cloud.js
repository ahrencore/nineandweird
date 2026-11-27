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
            callback:(token)=>{turnstileToken=token;if(hint){hint.textContent='';hint.hidden=true}},
            'expired-callback':()=>{turnstileToken='';if(hint){hint.hidden=false;hint.textContent='Security check expired. Try again.'}},
            'error-callback':()=>{turnstileToken='';if(hint){hint.hidden=false;hint.textContent='Security check failed. Try again.'}}
          });
          if(hint){hint.textContent='';hint.hidden=true}
        }catch(e){if(hint){hint.hidden=false;hint.textContent='Security check unavailable. Refresh the page.'};console.warn('Turnstile render',e)}
        return;
      }
      if(++tries<60)mountTimer=setTimeout(attempt,250);
      else if(hint){hint.hidden=false;hint.textContent='Security check unavailable. Refresh the page.'};
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
    const hint=turnstileContainer?.querySelector('.nw-captcha-status');if(hint){hint.textContent='';hint.hidden=true};
  }
  // Capture reset-link context before Supabase clears its auth callback parameters.
  // Explicit marker is placed in new recovery emails; the hash handles previously sent links.
  const initialSearch=new URLSearchParams(window.location.search);
  const initialHash=new URLSearchParams(window.location.hash.replace(/^#/,''));
  let recoveryLink=initialSearch.get('nw_recovery')==='1' || initialHash.get('type')==='recovery';
  let client=null, user=null, recovering=false;

  let listeners=[];
  const emit=()=>listeners.forEach(fn=>{try{fn(user)}catch(e){console.warn('NW auth listener',e)}});
  const ready=(async()=>{
    if(!window.supabase || !window.supabase.createClient){throw new Error('Supabase library could not load. Check your network connection.')}
    client=window.supabase.createClient(endpoint,publishable,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    // Subscribe before session initialization completes so the recovery redirect isn't missed.
    client.auth.onAuthStateChange((event,session)=>{
      user=session?.user||null;
      if(event==='PASSWORD_RECOVERY')recovering=true;
      // Some OAuth/callback variants produce SIGNED_IN rather than PASSWORD_RECOVERY.
      // Only trust this fallback when we started from an explicitly marked reset link.
      if(event==='SIGNED_IN' && recoveryLink && session?.user)recovering=true;
      if(event==='SIGNED_OUT'){recovering=false;recoveryLink=false;}
      emit();
    });
    const {data,error}=await client.auth.getUser();
    if(error && !/session missing/i.test(error.message||''))console.warn('NW auth start',error.message);
    user=data?.user||null;emit();
    return client;
  })();
  async function get(){return await ready;}
  async function invoke(method,params){const c=await get();const res=await c.auth[method](params);if(res.error)throw new Error(res.error.message);return res.data;}
  window.nwCloud={ready,get,mountCaptcha,clearCaptcha,captchaToken,resetCaptcha,user:()=>user,isRecovering:()=>recovering,finishRecovery:async(password)=>{if(!recovering||!user)throw new Error('Your reset link is no longer active. Request another one.');const c=await get();const {error}=await c.auth.updateUser({password});if(error)throw new Error(error.message);recovering=false;recoveryLink=false;
      if(new URLSearchParams(location.search).get('nw_recovery')==='1'){
        const clean=new URL(location.href);clean.searchParams.delete('nw_recovery');
        history.replaceState(history.state,'',clean.pathname+clean.search+clean.hash);
      }
      emit();},onChange:(fn)=>{listeners.push(fn);return ()=>listeners=listeners.filter(x=>x!==fn)},
    async signInProvider(provider){
      if(!['google','discord'].includes(provider))throw new Error('Sign-in option unavailable.');
      const c=await get();
      const {data,error}=await c.auth.signInWithOAuth({provider,options:{redirectTo:location.origin+location.pathname}});
      if(error)throw new Error(error.message);
      return data;
    },
    async linkProvider(provider){
      if(!['google','discord'].includes(provider))throw new Error('Sign-in option unavailable.');
      if(!user?.is_anonymous)throw new Error('Continue as Guest first.');
      const c=await get();
      const {data,error}=await c.auth.linkIdentity({provider,options:{redirectTo:location.origin+location.pathname}});
      if(error)throw new Error(error.message);
      return data;
    },
    signInAnonymously:()=>invoke('signInAnonymously',{options:{captchaToken:captchaToken()}}),
    signUp:(email,password)=>invoke('signUp',{email,password,options:{emailRedirectTo:location.origin+location.pathname,captchaToken:captchaToken()}}),
    signIn:(email,password)=>invoke('signInWithPassword',{email,password,options:{captchaToken:captchaToken()}}),
    signOut:()=>invoke('signOut'),
    async resetPassword(email){
      // Supabase resetPasswordForEmail takes TWO arguments: email and options.
      // Sending one object dropped the CAPTCHA token, causing 400 captcha_token errors.
      const c=await get();
      const token=captchaToken();
      const {data,error}=await c.auth.resetPasswordForEmail(email,{
        redirectTo:location.origin+location.pathname+'?nw_recovery=1',
        captchaToken:token
      });
      if(error)throw new Error(error.message);
      return data;
    },
    async readProfile(){const c=await get();if(!user)return null;const {data,error}=await c.from('nw_profiles').select('display_name,avatar,profile_setup_complete,equipped_frame,equipped_frame_month').eq('user_id',user.id).maybeSingle();if(error)throw new Error(error.message);return data;},
    async saveFrame(id,month=null){const c=await get();const account=user;if(!account)throw Error('Sign in to equip a frame.');if(!/^(usual|weird|monthly-(10|25|50|100|150|200))$/.test(id))throw Error('Invalid frame.');if(id.startsWith('monthly-')&&month!==new Date().toISOString().slice(0,7))throw Error('This monthly frame has expired.');const value={equipped_frame:id,equipped_frame_month:id.startsWith('monthly-')?month:null,updated_at:new Date().toISOString()};const {data,error}=await c.from('nw_profiles').update(value).eq('user_id',account.id).select('user_id').maybeSingle();if(error)throw Error(error.message);if(!data)throw Error('Profile unavailable; frame not saved.');return true;},
    async saveProfileAppearance(name,avatar,frameId,frameMonth=null){
      const c=await get();const account=user;
      if(!account||account.is_anonymous)throw Error('Registered account required.');
      if(!/^(usual|weird|monthly-(10|25|50|100|150|200))$/.test(frameId))throw Error('Invalid frame.');
      if(frameId.startsWith('monthly-')&&frameMonth!==new Date().toISOString().slice(0,7))throw Error('This monthly frame has expired.');
      const payload={display_name:name,avatar,equipped_frame:frameId,equipped_frame_month:frameId.startsWith('monthly-')?frameMonth:null,profile_setup_complete:true,updated_at:new Date().toISOString()};
      const {data,error}=await c.from('nw_profiles').update(payload).eq('user_id',account.id).select('user_id').maybeSingle();
      if(error)throw Error(error.code==='23505'?'Username is taken!':error.message);
      if(!data)throw Error('Profile unavailable; changes were not saved.');
      return true;
    },
    async usernameAvailable(name){const c=await get();if(!user||user.is_anonymous)throw Error('Please sign in first.');const {data,error}=await c.rpc('nw_username_available_v36',{p_name:name});if(error)throw Error(error.message);return data===true;},
    async saveProfile(name,avatar){const c=await get();const account=user;if(!account)throw Error('Please sign in first.');if(account.is_anonymous)name='Guest_'+account.id.replace(/-/g,'').slice(0,14).toLowerCase();else if(/^guest_/i.test(name))throw Error('Guest_ is reserved.');const payload={display_name:name,avatar,updated_at:new Date().toISOString()};if(!account.is_anonymous)payload.profile_setup_complete=true;const {data,error}=await c.from('nw_profiles').update(payload).eq('user_id',account.id).select('user_id').maybeSingle();if(error)throw Error(error.code==='23505'?'Username is taken!':error.message);if(!data){if(user?.id!==account.id)throw Error('Account changed. Please try again.');const {error:insertError}=await c.from('nw_profiles').insert({...payload,user_id:account.id});if(insertError)throw Error(insertError.code==='23505'?'Username is taken!':insertError.message);}}

  };
})();
