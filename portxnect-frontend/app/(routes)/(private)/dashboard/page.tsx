'use client'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setUser } from '@/app/slice/userSlice'
import { createClient } from '@/app/utils/supabase/client'
import { RootState } from '@/app/store/store'


const Dashboard = () => {
    const dispatch = useDispatch()
    const user = useSelector((state: RootState) => state.user.user)

    useEffect(() => {
        const supabase = createClient()

        // Fetch current logged-in user
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                dispatch(setUser(user))
            }
            console.log(user)
        }

        getUser()
    }, [dispatch])
    return <div>Welcome to Dashboard {user?.email}</div>
}

export default Dashboard
