import { supabaseInterface } from "../backend/supabase/supabase-interface"
import { mockBackendInterface } from "../backend/mock/mock-backend-interface"
import { expressInterface } from "../backend/express/express-interface";

const auth = expressInterface.auth;

export const authHelper = {

    signIn: auth.signIn,
    signOut: auth.signOut,
    signUp: auth.signUp,
    getCurrentUserProfile: auth.getCurrentUserProfile,
    updateProfile: auth.updateProfile,
    getSession: auth.getSession,
    onAuthStateChange: auth.onAuthStateChange

}