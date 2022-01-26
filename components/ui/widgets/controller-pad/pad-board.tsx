import { Flex, Grid } from '@chakra-ui/react';
import React from 'react';
import SoundPad from './pad';

type SoundBoardProps = {
  buttons: any[];
  columns: number;
  buttonSize: string;
};

function PadBoard(props: SoundBoardProps) {
  return (
    <Flex
      w={['100%', '100%', '100%', '100%']}
      direction="column"
      rounded="lg"
      align="center"
      m="2.5px"
    >
      <Grid
        templateColumns={[
          `repeat(${props.columns}, 1fr)`,
        ]}
        gap={8}
      >
        {props.buttons.map((button: any) => (
          <SoundPad
            buttonName={button.name}
            keyName={button.key}
            sound={button.sound}
            buttonSize={props.buttonSize}
            link={button.link}
          />
        ))}
      </Grid>
    </Flex>
  );
}

export default PadBoard;
