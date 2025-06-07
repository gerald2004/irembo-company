/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import * as React from 'react';
import Select from 'react-select';
import { defaultClassNames, defaultStyles } from './styles/selectStyles';
import {
  ClearIndicator,
  DropdownIndicator,
  MultiValueRemove,
  Option
} from './selectComponents';

const SimpleSelect = React.forwardRef((props, ref) => {
  const {
    value,

    onChange,
    options = [],
    styles = defaultStyles,
    classNames = defaultClassNames,
    components = {},
    ...rest
  } = props;

  return (
    <Select
      ref={ref}
      value={value}
      onChange={onChange}
      options={options}
      unstyled
      components={{
        DropdownIndicator,
        ClearIndicator,
        MultiValueRemove,
        Option,
        ...components
      }}
      styles={styles}
      classNames={classNames}
      {...rest}
    />
  );
});

export default SimpleSelect;