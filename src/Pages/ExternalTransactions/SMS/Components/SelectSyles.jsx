export const getSelectStyles = (theme) => {
    const isDark = theme === "dark";
    
    return {
      control: (provided, state) => ({
        ...provided,
        backgroundColor: isDark ? "hsl(240 10% 3.9%)" : "hsl(0 0% 100%)",
        borderColor: isDark ? "hsl(240 3.7% 15.9%)" : "hsl(240 5.9% 90%)",
        color: isDark ? "hsl(0 0% 98%)" : "hsl(240 10% 3.9%)",
        minHeight: '40px',
        boxShadow: state.isFocused 
          ? `0 0 0 2px ${isDark ? "hsl(240 5.9% 90%)" : "hsl(240 5% 84.9%)"}` 
          : 'none',
        '&:hover': {
          borderColor: isDark ? "hsl(240 3.7% 15.9%)" : "hsl(240 5% 84.9%)",
        },
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
          ? (isDark ? "hsl(240 4.9% 83.9%)" : "hsl(240 4.8% 95.9%)")
          : state.isFocused
          ? (isDark ? "hsl(240 3.7% 15.9%)" : "hsl(240 5% 96.1%)")
          : isDark ? "hsl(240 10% 3.9%)" : "hsl(0 0% 100%)",
        color: isDark ? "hsl(0 0% 98%)" : "hsl(240 10% 3.9%)",
        '&:active': {
          backgroundColor: isDark ? "hsl(240 3.7% 15.9%)" : "hsl(240 4.8% 95.9%)",
        },
      }),
      input: (provided) => ({
        ...provided,
        color: isDark ? "hsl(0 0% 98%)" : "hsl(240 10% 3.9%)",
      }),
      placeholder: (provided) => ({
        ...provided,
        color: isDark ? "hsl(240 5% 64.9%)" : "hsl(240 3.8% 46.1%)",
      }),
      singleValue: (provided) => ({
        ...provided,
        color: isDark ? "hsl(0 0% 98%)" : "hsl(240 10% 3.9%)",
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: isDark ? "hsl(240 3.7% 15.9%)" : "hsl(240 4.8% 95.9%)",
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color: isDark ? "hsl(0 0% 98%)" : "hsl(240 10% 3.9%)",
      }),
      multiValueRemove: (provided) => ({
        ...provided,
        color: isDark ? "hsl(240 5% 64.9%)" : "hsl(240 3.8% 46.1%)",
        ':hover': {
          backgroundColor: isDark ? "hsl(240 3.7% 15.9%)" : "hsl(240 5% 96.1%)",
          color: isDark ? "hsl(0 0% 98%)" : "hsl(240 10% 3.9%)",
        },
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: isDark ? "hsl(240 10% 3.9%)" : "hsl(0 0% 100%)",
        borderColor: isDark ? "hsl(240 3.7% 15.9%)" : "hsl(240 5.9% 90%)",
      }),
      dropdownIndicator: (provided) => ({
        ...provided,
        color: isDark ? "hsl(240 5% 64.9%)" : "hsl(240 3.8% 46.1%)",
        '&:hover': {
          color: isDark ? "hsl(0 0% 98%)" : "hsl(240 10% 3.9%)",
        },
      }),
      indicatorSeparator: (provided) => ({
        ...provided,
        backgroundColor: isDark ? "hsl(240 3.7% 15.9%)" : "hsl(240 5.9% 90%)",
      }),
      clearIndicator: (provided) => ({
        ...provided,
        color: isDark ? "hsl(240 5% 64.9%)" : "hsl(240 3.8% 46.1%)",
        '&:hover': {
          color: isDark ? "hsl(0 0% 98%)" : "hsl(240 10% 3.9%)",
        },
      }),
    };
  };