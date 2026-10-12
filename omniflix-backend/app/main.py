

from fastapi import FastAPI


app = FastAPI(title='OmniFlix Api')



@app.get("/")
def test():
    return { "status": "FastAPI Success" }
