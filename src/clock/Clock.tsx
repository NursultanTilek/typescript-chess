import { Component } from 'react';

interface ClockState {
  time: Date;
}

class Clock extends Component<ClockState> {
  timerInterval: number | null;

  constructor(props) {
    super(props);

    this.state = {
      time: new Date(),
    };

    this.timerInterval = null;
  }

  componentDidMount() {
    this.timerInterval = setInterval(() => {
      this.setState({ time: new Date() });
    }, 1000);
  }

  componentWillUnmount() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  render() {
    const { time } = this.state;
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');

    return (
        <div className=" bg-gray-800  p-4">
        <div className=" text-white flex justify-center items-center font-bold text-4xl">
          <span>{hours}</span>:<span>{minutes}</span>:<span>{seconds}</span>
        </div>
      </div>
    );
  }
}

export default Clock;

