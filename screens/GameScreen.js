import React, {Component} from 'react';
import {StyleSheet, View, Text, SafeAreaView, FlatList} from 'react-native';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {incrementRound, removeProject, progressProject, addBalance, subtractBalance} from '../reducers/GameAction'
import ListComponent from '../components/ProjectListCellComponent'
import {Alert} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient'

class GameScreen extends Component {

  constructor(props) {
    super(props);

    this.state = {
      slidersBackend: {},
      slidersFrontend: {}
    }
  }

  showQRScreen = () => {
    this.props.navigation.push('QR')
  };

  nextRound = () => {
    console.log("Finishing up round: " + this.props.player.round);

    /* debug only */
    // console.log(JSON.stringify(this.state.slidersBackend));
    // console.log(JSON.stringify(this.state.slidersFrontend));
    /* --- */

    let totalProjectsBackendUsed = 0;
    let totalProjectsFrontendUsed = 0;

    let sliderBackendMap = new Map();
    let sliderFrontendMap = new Map();

    Object.entries(this.state.slidersBackend)
      .forEach(([key, value]) => {
        sliderBackendMap.set(key, value);
        totalProjectsBackendUsed += value
      });
    Object.entries(this.state.slidersFrontend)
      .forEach(([key, value]) => {
        sliderFrontendMap.set(key, value);
        totalProjectsFrontendUsed += value
      });

    let totalDevBackendPower = 0;
    let totalDevFrontendPower = 0;

    this.props.player.developers.forEach((developer) => {
      console.log("Developer salary (" + developer.getId() + "): " + developer.getCost());
      totalDevBackendPower += developer.getBackendPower();
      totalDevFrontendPower += developer.getFrontendPower();
      this.props.decreaseBalance(developer.getCost());
    });

    this.props.player.projects.forEach((project) => {
      console.log("Progressing project: " + project.getId());

      let incrementalBackendProgress = 0;
      if (sliderBackendMap.has(project.getId())) {
        const slider = this.state.slidersBackend[project.getId()];
        incrementalBackendProgress = totalDevBackendPower * (slider / totalProjectsBackendUsed);
        incrementalBackendProgress = Math.round(incrementalBackendProgress * 100) / 100;
      }

      let incrementalFrontendProgress = 0;
      if (sliderFrontendMap.has(project.getId())) {
        const slider = this.state.slidersFrontend[project.getId()];
        incrementalFrontendProgress = totalDevFrontendPower * (slider / totalProjectsFrontendUsed);
        incrementalFrontendProgress = Math.round(incrementalFrontendProgress * 100) / 100;
      }

      const newProjectBackendProgress = project.getBackendProgress() + incrementalBackendProgress;
      const newProjectFrontendProgress = project.getFrontendProgress() + incrementalFrontendProgress;
      this.props.progressProj(project, newProjectBackendProgress, newProjectFrontendProgress);

      if (this.props.player.projectState[project.getId()] === project.getDuration()
          && project.getBackendProgress() >= project.getBackendPowerRequired()
            && project.getFrontendProgress() >= project.getFrontendPowerRequired()) {
        console.log("Project: " + project.getId() + " finished, adding: " + project.getIncome() + ", and removing");
        this.props.increaseBalance(project.getIncome());
        this.props.removeProj(project);
        alert("Project: " + project.getName() + " finished!" + "\n" + "You've earned: "
          + project.getIncome());
      } else if (project.getBackendProgress() >= project.getBackendPowerRequired()
          && project.getFrontendProgress() >= project.getFrontendPowerRequired()) {
        console.log("Project: " + project.getId() + " finished before time, adding: "
          + project.getIncome() + ", and removing");
        //todo: some extra bonus for finishing the project before deadline?
        this.props.increaseBalance(project.getIncome());
        this.props.removeProj(project);
        alert("Project: " + project.getName() + " finished before deadline!" + "\n"
          + "You've earned: " + project.getIncome());
      } else if (this.props.player.projectState[project.getId()] === project.getDuration()) {
        console.log("Project: " + project.getId() + " not finished on time, removing...");
        this.props.removeProj(project);
        alert("Project not finished on time...");
        // todo: add some balance OR ask for more time...?
      } else{
        console.log("Project: " + project.getId() + ": "
          + this.props.player.projectState[project.getId()] + "/" + project.getDuration());
      }
    });

    console.log("Finishing round with balance: " + this.props.player.balance);
    if (this.props.player.balance >= this.props.player.maxLoan) {
      this.props.incRound();

      console.log("Moving to the next round: " + (this.props.player.round + 1));
    } else {
      // game over
      alert("Game Over");
    }

  };

  valueBackendDidChange = (item, value) => {
    console.log("valueBackendDidChange: ", {[item.getId()]: value});

    this.setState({
      slidersBackend: {
        ...this.state.slidersBackend,
        [item.getId()]: Math.round(value * 100) / 100
      }
    });
  };

  valueFrontendDidChange = (item, value) => {
    console.log("valueFrontendDidChange: ", {[item.getId()]: value});

    this.setState({
      slidersFrontend: {
        ...this.state.slidersFrontend,
        [item.getId()]: Math.round(value * 100) / 100
      }
    });
  };

  render() {
    return (
      <View style={{flex: 1, backgroundColor: '#f9d671'}}>
      <SafeAreaView style={{flex: 1, flexDirection: 'col'}}>
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 1, height: 70, width: 30}}>
            <Text style={styles.amount}>{this.props.player.round}</Text>
          </View>
          <View style={{flex: 2, height: 70}}>
            <Text style={styles.amount}>{this.props.player.balance}$</Text>
          </View>
          <View style={styles.buttonView}>
            <Text style={styles.button} onPress={this.showQRScreen}>QR</Text>
          </View>
        </View>
        <View style={{flex: 1}}>
          <FlatList
            data={this.props.player.projects}
            extraData={this.state}
            renderItem={
              ({item}) => <ListComponent
                item={item}
                roundsLeft={item.getDuration() - this.props.player.projectState[item.getId()]}
                valueBackendDidChange={this.valueBackendDidChange}
                valueFrontendDidChange={this.valueFrontendDidChange}
                onPressDelete={() => {
                  console.log("delete id: " + item.getId());
                  const project = this.props.player.projects.find((e) => e.getId() === item.getId());
                  Alert.alert(
                    `Do you want to remove project ${project.getName()}`,
                    `Project will ben deleted permanently`,
                    [
                      {
                        text: 'Cancel',
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel',
                      }, {
                        text: 'OK',
                        onPress: () => {
                          console.log('OK Pressed');
                          this.props.removeProj(project);
                        }
                      },
                    ],
                    {cancelable: false},
                  );
                }}
              />
            }
            contentInset={{bottom:49}}
            automaticallyAdjustContentInsets={false}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
        <View style={{flexDirection: 'row'}}>
          <View style={styles.buttonView2}>
            <Text style={styles.button} onPress={this.nextRound}>Next round</Text>
          </View>
        </View>
      </SafeAreaView>
      </View>
      
    )
  }
}

const styles = StyleSheet.create({
  amount: {
    fontSize: 50,
    fontStyle: 'italic',
    fontFamily: 'Roboto-Italic',
    color: '#FFFFFF',
    alignItems: 'flex-start',
    margin: 5
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0
  },
  button: {
    textAlign: 'center',
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: 'Roboto-Regular'
  },
  buttonView: {
    width: 60,
    height: 60,
    backgroundColor: '#00C9A7',
    justifyContent: 'center',
    borderRadius: 10,
    margin: 5
  },
  buttonView2: {
    flex: 1,
    width: 150,
    height: 60,
    backgroundColor: '#00C9A7',
    justifyContent: 'center',
    borderRadius: 30,
    margin: 10
  },
});

const mapDispatchToProps = dispatch => (
  bindActionCreators({
    incRound: incrementRound,
    removeProj: removeProject,
    progressProj: progressProject,
    increaseBalance: addBalance,
    decreaseBalance: subtractBalance
  }, dispatch)
);

const mapStateToProps = (state) => {
  const {player} = state;
  return {player}
};

export default connect(mapStateToProps, mapDispatchToProps)(GameScreen);
