import React, { useEffect, useRef } from 'react';
import { Card, Form, Button, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import type { ChatMessage, Selection } from '../App';
import type { Problem } from '../geminiService';

interface Props {
  selection: Selection;
  coins: number;
  explanationTickets: number;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  userAnswer: string;
  onUserAnswerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRequestProblem: () => void;
  onAnswerSubmit: (e: React.FormEvent) => void;
  onPurchaseExplanationTicket: () => void;
  onUseExplanationTicket: () => void;
  isHomeworkExplanationMode: boolean;
  homeworkProblemInput: string;
  onHomeworkProblemInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitHomeworkProblem: (e: React.FormEvent) => void;
  currentProblem: Problem | null;
}

const TutorView: React.FC<Props> = ({
  selection,
  coins,
  explanationTickets,
  chatHistory,
  isLoading,
  userAnswer,
  onUserAnswerChange,
  onRequestProblem,
  onAnswerSubmit,
  onPurchaseExplanationTicket,
  onUseExplanationTicket,
  isHomeworkExplanationMode,
  homeworkProblemInput,
  onHomeworkProblemInputChange,
  onSubmitHomeworkProblem,
  currentProblem,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const getAlertVariant = (sender: ChatMessage['sender']) => {
    switch (sender) {
      case 'ai': return 'primary';
      case 'user': return 'light';
      case 'system': return 'info';
    }
  }

  return (
    <Card>
      <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
        AI 튜터
        <div>
          <Badge bg="success" className="me-2">코인: {coins}개</Badge>
          <Badge bg="info">해설권: {explanationTickets}개</Badge>
        </div>
      </Card.Header>
      <Card.Body style={{ height: '400px', overflowY: 'auto' }}>
        {chatHistory.map((msg, index) => (
          <Alert key={index} variant={getAlertVariant(msg.sender)} className={msg.sender === 'user' ? 'text-end' : ''}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
          </Alert>
        ))}
        {isLoading && <div className="text-center"><Spinner animation="border" /></div>}
        <div ref={chatEndRef} />
      </Card.Body>
      <Card.Footer>
        {isHomeworkExplanationMode ? (
          <Form onSubmit={onSubmitHomeworkProblem}>
            <Row className="align-items-center">
              <Col>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="숙제 문제를 입력하세요..."
                  value={homeworkProblemInput}
                  onChange={onHomeworkProblemInputChange}
                  disabled={isLoading}
                />
              </Col>
              <Col xs="auto">
                <Button type="submit" disabled={isLoading || homeworkProblemInput.trim() === ''}>해설 요청</Button>
              </Col>
            </Row>
          </Form>
        ) : (
          <Form onSubmit={onAnswerSubmit}>
            <Row className="align-items-center">
              <Col>
                <Form.Control
                  type="text"
                  placeholder={currentProblem ? "정답을 입력하세요..." : "먼저 문제를 받아주세요."}
                  value={userAnswer}
                  onChange={onUserAnswerChange}
                  disabled={!currentProblem || isLoading}
                />
              </Col>
              <Col xs="auto">
                <Button type="submit" disabled={!currentProblem || isLoading || userAnswer.trim() === ''}>답안 제출</Button>
              </Col>
            </Row>
          </Form>
        )}
        <hr />
        <Row>
          <Col>
            <Button 
              variant="primary" 
              onClick={onRequestProblem} 
              disabled={isLoading || !!currentProblem || !selection.unit || isHomeworkExplanationMode}
              className="w-100"
            >
              문제 받기
            </Button>
          </Col>
          <Col>
            <Button 
              variant="secondary" 
              onClick={onPurchaseExplanationTicket} 
              disabled={isLoading || coins < 50 || isHomeworkExplanationMode} 
              className="w-100 mb-2"
            >
              해설권 구매 (50 코인)
            </Button>
            <Button 
              variant="success" 
              onClick={onUseExplanationTicket} 
              disabled={isLoading || explanationTickets <= 0 || isHomeworkExplanationMode} 
              className="w-100"
            >
              해설권 사용
            </Button>
          </Col>
        </Row>
      </Card.Footer>
    </Card>
  );
};

export default TutorView;
