import { useState } from 'react';

export default function Input({ className = '', type = 'text', rightAdornment, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && show ? 'text' : type;

  return (
    <div className="relative">
      <input 
        className={`input pr-12 ${className}`} 
        type={inputType}
        {...props} 
      />
      {isPassword && (
        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
          onClick={() => setShow(s => !s)}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      )}
      {rightAdornment}
    </div>
  );
}
