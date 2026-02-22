'use client'
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
const supabase=createClient();



export function useAuth(){
  const[user,setUser]=useState<any>(null);

  const[authloading,setAuthloading]=useState(true);


  useEffect(()=>{
    setAuthloading(true);
    const getInitialSession=async()=>{
     try{
      const{data,error}=await supabase.auth.getSession();

      if(error){
        console.log("Error fetching session:",error);
        return;
      }
      setUser(data.session?.user ?? null);

     }
     catch(err){
      console.log(err)
      setUser(null)
     }
     finally{
      setAuthloading(false);
     }
    }
    getInitialSession();


    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        return;
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();


  },[])

  return {user,authloading,isAuthenticated:!!user}

}