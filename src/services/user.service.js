import supabase from "../config/db.js";

export const getUserById = async (userId) => {
  return await supabase
    .from("Clients")
    .select("id, fullname, email, profile_pic")
    .eq("id", userId)
    .single();
};

export const getUsers = async (userId) => {
  return await supabase
    .from("Clients")
    .select("id, fullname, email, profile_pic")
    .neq("id", userId);
};

export const addUser = async (user) => {
  return await supabase.from("Clients").insert(user).select();
};

export const getUserByEmail = async (email) => {
  return await supabase.from("Clients").select("*").eq("email", email);
};

export const updateUserById = async (id, updatedFields) => {
  return await supabase
    .from("Clients")
    .update(updatedFields)
    .eq("id", id)
    .select();
};
