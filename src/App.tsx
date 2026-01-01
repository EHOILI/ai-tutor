import React, { useState } from 'react';
import { Container, Row, Col, Navbar } from 'react-bootstrap';
import CurriculumSelector from './components/CurriculumSelector';
import TutorView from './components/TutorView';
import { curriculumData } from './curriculumData';
import { generateProblem, generateExplanationForHomework } from './geminiService';
import type { Problem } from './geminiService';

export interface Selection {
  school: string;
  grade: string;
  semester: string;
  unit: string;
  subUnit: string;
}

export interface ChatMessage {
  sender: 'ai' | 'user' | 'system';
  text: string;
}

function App() {
  const [selection, setSelection] = useState<Selection>({
    school: '',
    grade: '',
    semester: '',
    unit: '',
    subUnit: '',
  });
  const [coins, setCoins] = useState<number>(100);
  const [explanationTickets, setExplanationTickets] = useState<number>(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { sender: 'system', text: '좌측 메뉴에서 학습할 과정을 선택하고 문제 받기 버튼을 눌러주세요.' }
  ]);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isHomeworkExplanationMode, setIsHomeworkExplanationMode] = useState<boolean>(false);
  const [homeworkProblemInput, setHomeworkProblemInput] = useState<string>('');

  const handleHomeworkProblemInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHomeworkProblemInput(e.target.value);
  };

  const handleSubmitHomeworkProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkProblemInput.trim()) return;

    setIsLoading(true);
    addMessageToChat({ sender: 'user', text: `숙제 문제: ${homeworkProblemInput}` });
    addMessageToChat({ sender: 'system', text: '숙제 문제에 대한 해설을 생성하고 있습니다...' });

    const explanation = await generateExplanationForHomework(homeworkProblemInput);
    setIsLoading(false);

    if (explanation) {
      addMessageToChat({ sender: 'ai', text: `[숙제 해설]\n${explanation}` });
    } else {
      addMessageToChat({ sender: 'system', text: '숙제 해설 생성에 실패했습니다. 다시 시도해주세요.' });
    }

    setHomeworkProblemInput('');
    setIsHomeworkExplanationMode(false); // Exit homework explanation mode
  };

  // ... (existing code)

  const handleUseExplanationTicket = () => {
    if (explanationTickets > 0) {
      setExplanationTickets(prev => prev - 1);
      setIsHomeworkExplanationMode(true);
      addMessageToChat({ sender: 'system', text: '해설권을 사용했습니다. 이제 아래 입력창에 숙제 문제를 입력해주세요.' });
    } else {
      addMessageToChat({ sender: 'system', text: '해설권이 부족합니다. 해설권을 구매해주세요.' });
    }
  };

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSelection(prev => {
      const newSelection = { ...prev, [name]: value };
      if (name === 'school') {
        newSelection.grade = '';
        newSelection.semester = '';
        newSelection.unit = '';
        newSelection.subUnit = '';
      }
      if (name === 'grade') {
        newSelection.semester = '';
        newSelection.unit = '';
        newSelection.subUnit = '';
      }
      if (name === 'semester') {
        newSelection.unit = '';
        newSelection.subUnit = '';
      }
      if (name === 'unit') {
        newSelection.subUnit = '';
      }
      return newSelection;
    });
  };
  
  const addMessageToChat = (message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
  };

  const handleRequestProblem = async () => {
    if (!selection.unit) {
      addMessageToChat({ sender: 'system', text: '모든 과정을 선택해야 문제를 생성할 수 있습니다.'});
      return;
    }
    setIsLoading(true);
    
    const systemMessage = selection.subUnit
      ? `'${selection.unit} - ${selection.subUnit}' 단원에 대한 문제를 생성하고 있습니다...`
      : `'${selection.unit}' 단원에 대한 문제를 생성하고 있습니다...`;
    addMessageToChat({ sender: 'system', text: systemMessage });
    
    const problem = await generateProblem(selection);
    setIsLoading(false);
    
    if (problem) {
      setCurrentProblem(problem);
      addMessageToChat({ sender: 'ai', text: problem.question });
    } else {
      addMessageToChat({ sender: 'system', text: '문제를 생성하는 데 실패했습니다. 다시 시도해주세요.'});
    }
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem || userAnswer.trim() === '') return;

    addMessageToChat({ sender: 'user', text: userAnswer });
    // Simple answer check, can be improved
    if (userAnswer.trim() === currentProblem.answer) {
      const newCoins = coins + 100;
      setCoins(newCoins);
      addMessageToChat({ sender: 'system', text: '정답입니다! 100 코인을 획득했습니다.' });
    } else {
      addMessageToChat({ sender: 'system', text: '오답입니다. 다시 시도해보세요.' });
    }
    setUserAnswer('');
    setCurrentProblem(null); // Allow user to request a new problem
  };

  const handlePurchaseExplanationTicket = () => {
    if (coins >= 50) {
      const newCoins = coins - 50;
      setCoins(newCoins);
      setExplanationTickets(prev => prev + 1);
      addMessageToChat({ sender: 'system', text: '해설권 1개를 구매했습니다. 이제 숙제 문제를 AI에게 질문할 수 있습니다.' });
    } else {
      addMessageToChat({ sender: 'system', text: '코인이 부족하여 해설권을 구매할 수 없습니다.' });
    }
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#home">AI 학습 튜터</Navbar.Brand>
        </Container>
      </Navbar>
      <Container fluid="md" className="mt-4">
        <Row>
          <Col md={4} className="mb-3">
            <CurriculumSelector 
              selection={selection}
              onSelectionChange={handleSelectionChange}
              curriculumData={curriculumData}
            />
          </Col>
          <Col md={8}>
            <TutorView
              selection={selection}
              coins={coins}
              explanationTickets={explanationTickets}
              chatHistory={chatHistory}
              isLoading={isLoading}
              userAnswer={userAnswer}
              onUserAnswerChange={(e) => setUserAnswer(e.target.value)}
              onRequestProblem={handleRequestProblem}
              onAnswerSubmit={handleAnswerSubmit}
              onPurchaseExplanationTicket={handlePurchaseExplanationTicket}
              onUseExplanationTicket={handleUseExplanationTicket}
              isHomeworkExplanationMode={isHomeworkExplanationMode}
              homeworkProblemInput={homeworkProblemInput}
              onHomeworkProblemInputChange={handleHomeworkProblemInputChange}
              onSubmitHomeworkProblem={handleSubmitHomeworkProblem}
              currentProblem={currentProblem}
            />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
