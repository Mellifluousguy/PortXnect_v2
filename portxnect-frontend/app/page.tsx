"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";

export default function Navbar() {
  const user = useSelector((state: RootState) => state.user.user);
  console.log(user);

  return <p>{user ? `Welcome, User` : "Not logged in"}</p>;
}
