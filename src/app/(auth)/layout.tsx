import { useAuth } from "@/hooks/useAuth"
import { getServerUser } from "@/lib/auth/server"
import { redirect } from "next/navigation";

export default async function Layout({children}:{
    children:React.ReactNode
}){
    const user=await getServerUser();
    if(user){
        redirect("/first-entry");
    }

    return(
        <div>

            {children}
        </div>
    )
}