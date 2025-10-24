"use client"
import React from 'react'
import Background from "@/app/components/InteractiveDotsCursor"
import ConsoleTerminal from './console'

const page = () => {
    return (
        <main onContextMenu={(e) => e.preventDefault()} className='relative bg-console-bgl dark:bg-console-bgl-dark z-10 grid place-items-center overflow-hidden min-h-lvh w-lvw'>
            <Background
                particleColors={['#E6E5E5, #B3B3B3', '#14B38A']}
                particleCount={100}
                particleSpread={10}
                speed={0.2}
                particleBaseSize={200}
                moveParticlesOnHover={true}
                alphaParticles={false}
                disableRotation={false}
                className='top-0 -z-10 bg-console-bgl dark:bg-console-bgl-dark'
            />

            <ConsoleTerminal />
        </main>
    )
}

export default page