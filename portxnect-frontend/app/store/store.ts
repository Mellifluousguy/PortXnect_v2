"use client"
import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "@/app/slice/themeSlice"
import userReducer from "@/app/slice/userSlice"

export const store = configureStore({
    reducer: {
        theme: themeReducer,
        user: userReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;