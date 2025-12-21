import React from 'react'

const MaxWidthWrapper = ({children}: {children: React.ReactNode}) => {
  return (
    <div className='w-full max-w-screen-2xl  overflow-x-hidden'>
        {children}
    </div>
  )
}

export default MaxWidthWrapper